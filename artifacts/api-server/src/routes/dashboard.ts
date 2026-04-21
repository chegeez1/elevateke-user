import { Router, type IRouter } from "express";
import { db, usersTable, depositsTable, withdrawalsTable, earningsTable, tradesTable, inboxMessagesTable } from "@workspace/db";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", authenticate, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const activeDeposits = await db.select().from(depositsTable)
    .where(and(eq(depositsTable.userId, userId), eq(depositsTable.status, "active")));

  const pendingWithdrawals = await db.select({ total: sql<number>`coalesce(sum(${withdrawalsTable.amount}), 0)` })
    .from(withdrawalsTable).where(and(eq(withdrawalsTable.userId, userId), eq(withdrawalsTable.status, "pending")));

  const todayEarnings = await db.select({ total: sql<number>`coalesce(sum(${earningsTable.amount}), 0)` })
    .from(earningsTable).where(and(eq(earningsTable.userId, userId), gte(earningsTable.createdAt, today)));

  const unreadMessages = await db.select({ count: sql<number>`count(*)` })
    .from(inboxMessagesTable).where(and(eq(inboxMessagesTable.userId, userId), eq(inboxMessagesTable.isRead, false)));

  const [activeTrade] = await db.select().from(tradesTable)
    .where(and(eq(tradesTable.userId, userId), eq(tradesTable.status, "active")));

  const loginBonusAvailable = !user.loginBonusClaimedAt || user.loginBonusClaimedAt < today;

  let nextEarningAt: string | null = null;
  if (activeDeposits.length > 0) {
    const lastEarning = activeDeposits[0].lastEarningAt;
    if (lastEarning) {
      const next = new Date(lastEarning.getTime() + 24 * 60 * 60 * 1000);
      nextEarningAt = next.toISOString();
    } else {
      nextEarningAt = new Date(activeDeposits[0].startsAt?.getTime()! + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  res.json({
    balance: Number(user.balance),
    totalEarned: Number(user.totalEarned),
    totalDeposited: Number(user.totalDeposited),
    pendingWithdrawals: Number(pendingWithdrawals[0]?.total ?? 0),
    activeDeposits: activeDeposits.length,
    nextEarningAt,
    todayEarned: Number(todayEarnings[0]?.total ?? 0),
    vipLevel: user.vipLevel,
    unreadMessages: Number(unreadMessages[0]?.count ?? 0),
    loginBonusAvailable,
    activeTrade: activeTrade ? {
      id: activeTrade.id, amount: Number(activeTrade.amount), multiplier: activeTrade.multiplier,
      durationMins: activeTrade.durationMins, direction: activeTrade.direction,
      result: activeTrade.result ?? null, profitLoss: activeTrade.profitLoss ? Number(activeTrade.profitLoss) : null,
      status: activeTrade.status, startedAt: activeTrade.startedAt.toISOString(),
      endedAt: activeTrade.endedAt?.toISOString() ?? null,
    } : undefined,
  });
});

export default router;
