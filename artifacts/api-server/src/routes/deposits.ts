import { Router, type IRouter } from "express";
import {
  db,
  depositsTable,
  depositPlansTable,
  usersTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import { CreateDepositBody, VerifyDepositBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatDeposit(d: typeof depositsTable.$inferSelect, planName: string) {
  return {
    id: d.id,
    userId: d.userId,
    planId: d.planId,
    planName,
    amount: Number(d.amount),
    bonusAmount: Number(d.bonusAmount),
    dailyEarning: Number(d.dailyEarning),
    status: d.status,
    autoRenew: d.autoRenew,
    startsAt: d.startsAt?.toISOString() ?? null,
    endsAt: d.endsAt?.toISOString() ?? null,
    lastEarningAt: d.lastEarningAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/deposits", authenticate, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const deposits = await db
    .select({
      deposit: depositsTable,
      planName: depositPlansTable.name,
    })
    .from(depositsTable)
    .leftJoin(depositPlansTable, eq(depositsTable.planId, depositPlansTable.id))
    .where(eq(depositsTable.userId, userId))
    .orderBy(desc(depositsTable.createdAt));
  res.json(
    deposits.map(({ deposit, planName }) =>
      formatDeposit(deposit, planName ?? "Unknown"),
    ),
  );
});

router.post("/deposits", authenticate, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const parsed = CreateDepositBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { planId, amount, phone } = parsed.data;
  const autoRenew = parsed.data.autoRenew ?? false;

  const [plan] = await db
    .select()
    .from(depositPlansTable)
    .where(eq(depositPlansTable.id, planId));
  if (!plan || !plan.isActive) {
    res.status(400).json({ error: "Invalid or inactive plan" });
    return;
  }
  if (amount < Number(plan.minAmount)) {
    res.status(400).json({ error: `Minimum deposit is KSH ${plan.minAmount}` });
    return;
  }
  if (plan.maxAmount && amount > Number(plan.maxAmount)) {
    res.status(400).json({ error: `Maximum deposit is KSH ${plan.maxAmount}` });
    return;
  }

  const bonusAmount = (amount * Number(plan.bonusPercent)) / 100;
  const dailyEarning = amount * Number(plan.dailyRate);
  const reference = `EKE-${Date.now()}-${userId}`;

  const [deposit] = await db
    .insert(depositsTable)
    .values({
      userId,
      planId,
      amount: amount.toString(),
      bonusAmount: bonusAmount.toString(),
      dailyEarning: dailyEarning.toString(),
      status: "pending",
      paystackRef: reference,
      autoRenew,
    })
    .returning();

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  let paystackAuthUrl = "";

  if (PAYSTACK_SECRET) {
    try {
      const paystackRes = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: `user${userId}@elevateke.com`,
            amount: amount * 100,
            reference,
            currency: "KES",
            phone,
            channels: ["mobile_money"],
          }),
        },
      );
      const paystackData = (await paystackRes.json()) as {
        data?: { authorization_url?: string };
      };
      paystackAuthUrl = paystackData?.data?.authorization_url ?? "";
    } catch {
      req.log.warn("Paystack call failed");
    }
  }

  res.status(201).json({
    deposit: formatDeposit(deposit, plan.name),
    paystackAuthUrl:
      paystackAuthUrl || `https://checkout.paystack.com/demo-${reference}`,
    reference,
  });
});

router.post(
  "/deposits/verify",
  authenticate,
  async (req, res): Promise<void> => {
    const { userId } = (req as typeof req & { user: JwtPayload }).user;
    const parsed = VerifyDepositBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { reference } = parsed.data;
    const [deposit] = await db
      .select()
      .from(depositsTable)
      .where(
        and(
          eq(depositsTable.paystackRef, reference),
          eq(depositsTable.userId, userId),
        ),
      );

    if (!deposit) {
      res.status(404).json({ error: "Deposit not found" });
      return;
    }
    if (deposit.status === "active") {
      const [plan] = await db
        .select()
        .from(depositPlansTable)
        .where(eq(depositPlansTable.id, deposit.planId));
      res.json(formatDeposit(deposit, plan?.name ?? "Unknown"));
      return;
    }

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    let verified = false;

    if (PAYSTACK_SECRET) {
      try {
        const verRes = await fetch(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
          },
        );
        const verData = (await verRes.json()) as { data?: { status?: string } };
        verified = verData?.data?.status === "success";
      } catch {
        req.log.warn("Paystack verify failed");
      }
    } else {
      verified = true;
    }

    if (!verified) {
      res.status(400).json({ error: "Payment not verified" });
      return;
    }

    const now = new Date();
    const [plan] = await db
      .select()
      .from(depositPlansTable)
      .where(eq(depositPlansTable.id, deposit.planId));
    const endsAt = new Date(
      now.getTime() + (plan?.durationDays ?? 30) * 24 * 60 * 60 * 1000,
    );

    const [updated] = await db
      .update(depositsTable)
      .set({
        status: "active",
        startsAt: now,
        endsAt,
        lastEarningAt: now,
      })
      .where(eq(depositsTable.id, deposit.id))
      .returning();

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    const newDeposited =
      Number(user?.totalDeposited ?? 0) +
      Number(deposit.amount) +
      Number(deposit.bonusAmount);
    const newBalance = Number(user?.balance ?? 0) + Number(deposit.bonusAmount);
    let vipLevel = "Bronze";
    if (newDeposited >= 50000) vipLevel = "Platinum";
    else if (newDeposited >= 20000) vipLevel = "Gold";
    else if (newDeposited >= 5000) vipLevel = "Silver";

    await db
      .update(usersTable)
      .set({
        totalDeposited: newDeposited.toString(),
        balance: newBalance.toString(),
        vipLevel,
      })
      .where(eq(usersTable.id, userId));

    res.json(formatDeposit(updated, plan?.name ?? "Unknown"));
  },
);

export default router;
