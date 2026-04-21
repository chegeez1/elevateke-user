import { Router, type IRouter } from "express";
import { db, earningsTable, usersTable, depositsTable, depositPlansTable, inboxMessagesTable, platformSettingsTable } from "@workspace/db";
import { eq, and, gte, desc, asc } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import { ReinvestEarningsBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/earnings", authenticate, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const earnings = await db.select().from(earningsTable)
    .where(eq(earningsTable.userId, userId)).orderBy(desc(earningsTable.createdAt)).limit(100);
  res.json(earnings.map(e => ({
    id: e.id, amount: Number(e.amount), type: e.type,
    description: e.description ?? null, createdAt: e.createdAt.toISOString(),
  })));
});

router.post("/earnings/claim", authenticate, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;

  const activeDeposits = await db.select({
    deposit: depositsTable,
    plan: depositPlansTable,
  }).from(depositsTable)
    .leftJoin(depositPlansTable, eq(depositsTable.planId, depositPlansTable.id))
    .where(and(eq(depositsTable.userId, userId), eq(depositsTable.status, "active")));

  if (activeDeposits.length === 0) {
    res.status(400).json({ error: "No active deposits to earn from" }); return;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let totalClaimed = 0;

  for (const { deposit, plan } of activeDeposits) {
    const lastEarning = deposit.lastEarningAt;
    if (lastEarning && lastEarning >= today) continue;

    const dailyEarning = Number(deposit.dailyEarning);
    await db.update(depositsTable).set({ lastEarningAt: new Date() }).where(eq(depositsTable.id, deposit.id));
    await db.insert(earningsTable).values({
      userId, amount: dailyEarning.toString(), type: "daily",
      description: `Daily return from ${plan?.name ?? "Investment"}`,
    });
    totalClaimed += dailyEarning;
  }

  if (totalClaimed === 0) {
    res.status(400).json({ error: "Daily earnings already claimed or no eligible deposits" }); return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const newBalance = Number(user?.balance ?? 0) + totalClaimed;
  const newTotalEarned = Number(user?.totalEarned ?? 0) + totalClaimed;

  await db.update(usersTable).set({
    balance: newBalance.toString(), totalEarned: newTotalEarned.toString(),
  }).where(eq(usersTable.id, userId));

  res.json({ amount: totalClaimed, newBalance, message: `Claimed KSH ${totalClaimed} in daily earnings!` });
});

router.post("/earnings/reinvest", authenticate, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const parsed = ReinvestEarningsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { amount, planId } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || Number(user.balance) < amount) {
    res.status(400).json({ error: "Insufficient balance" }); return;
  }

  // Resolve deposit plan — use provided planId or auto-select cheapest eligible
  let plan: typeof depositPlansTable.$inferSelect | undefined;

  if (planId) {
    const [found] = await db.select().from(depositPlansTable)
      .where(and(eq(depositPlansTable.id, planId), eq(depositPlansTable.isActive, true)));
    if (!found) { res.status(400).json({ error: "Selected plan not found or inactive" }); return; }
    if (amount < Number(found.minAmount)) {
      res.status(400).json({ error: `Minimum for ${found.name} is KSH ${found.minAmount}` }); return;
    }
    if (found.maxAmount !== null && amount > Number(found.maxAmount)) {
      res.status(400).json({ error: `Maximum for ${found.name} is KSH ${found.maxAmount}` }); return;
    }
    plan = found;
  } else {
    // Auto-select cheapest eligible plan
    const plans = await db.select().from(depositPlansTable)
      .where(eq(depositPlansTable.isActive, true))
      .orderBy(asc(depositPlansTable.minAmount));
    plan = plans.find(p =>
      amount >= Number(p.minAmount) &&
      (p.maxAmount === null || amount <= Number(p.maxAmount))
    );
    if (!plan) {
      res.status(400).json({ error: `Amount KSH ${amount} does not fit any active plan. Minimum is KSH ${plans[0]?.minAmount ?? 500}.` }); return;
    }
  }

  // Create the deposit record (active immediately — no M-Pesa needed for reinvestment)
  const now = new Date();
  const endsAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  const dailyEarning = amount * Number(plan.dailyRate);

  await db.insert(depositsTable).values({
    userId,
    planId: plan.id,
    amount: amount.toString(),
    bonusAmount: "0",
    dailyEarning: dailyEarning.toString(),
    status: "active",
    paystackRef: `reinvest-${Date.now()}-${userId}`,
    startsAt: now,
    endsAt,
    lastEarningAt: now,
  });

  // Deduct balance, update totalDeposited
  const newBalance = Number(user.balance) - amount;
  const newDeposited = Number(user.totalDeposited) + amount;

  // Recalculate VIP level from platform settings
  const vipSettings = await db.select().from(platformSettingsTable)
    .then(rows => {
      const get = (key: string, def: number) => Number(rows.find(r => r.key === key)?.value ?? def);
      return {
        silver: get("vip_silver_min", 5000),
        gold: get("vip_gold_min", 20000),
        platinum: get("vip_platinum_min", 50000),
      };
    });
  let vipLevel = "Bronze";
  if (newDeposited >= vipSettings.platinum) vipLevel = "Platinum";
  else if (newDeposited >= vipSettings.gold) vipLevel = "Gold";
  else if (newDeposited >= vipSettings.silver) vipLevel = "Silver";

  await db.update(usersTable).set({
    balance: newBalance.toString(),
    totalDeposited: newDeposited.toString(),
    vipLevel,
  }).where(eq(usersTable.id, userId));

  // Send inbox notification
  const dailyFmt = dailyEarning.toLocaleString("en-KE");
  const amountFmt = amount.toLocaleString("en-KE");
  db.insert(inboxMessagesTable).values({
    userId,
    title: "Reinvestment Activated",
    content: `Your reinvestment of KSH ${amountFmt} under the ${plan.name} plan is now active. You will earn KSH ${dailyFmt} per day for ${plan.durationDays} days.`,
  }).catch(() => {});

  res.json({ success: true, message: `KSH ${amountFmt} reinvested into ${plan.name}. Earning KSH ${dailyFmt}/day!` });
});

export default router;
