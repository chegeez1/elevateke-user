import { Router, type IRouter } from "express";
import { db, earningsTable, usersTable, depositsTable, depositPlansTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
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

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || Number(user.balance) < parsed.data.amount) {
    res.status(400).json({ error: "Insufficient balance" }); return;
  }

  const newBalance = Number(user.balance) - parsed.data.amount;
  const newDeposited = Number(user.totalDeposited) + parsed.data.amount;
  await db.update(usersTable).set({
    balance: newBalance.toString(), totalDeposited: newDeposited.toString(),
  }).where(eq(usersTable.id, userId));

  res.json({ success: true, message: `KSH ${parsed.data.amount} reinvested from your balance` });
});

export default router;
