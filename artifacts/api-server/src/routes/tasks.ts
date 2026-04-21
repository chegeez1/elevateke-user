import { Router, type IRouter } from "express";
import { db, tasksTable, taskCompletionsTable, earningsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/tasks", authenticate, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.isActive, true));

  const completions = await db.select({ taskId: taskCompletionsTable.taskId })
    .from(taskCompletionsTable).where(eq(taskCompletionsTable.userId, userId));
  const completedIds = new Set(completions.map(c => c.taskId));

  res.json(tasks.map(t => ({
    id: t.id, title: t.title, description: t.description,
    reward: Number(t.reward), link: t.link ?? null,
    isActive: t.isActive, isCompleted: completedIds.has(t.id),
    createdAt: t.createdAt.toISOString(),
  })));
});

router.post("/tasks/:id/complete", authenticate, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [task] = await db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.isActive, true)));
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  const [existing] = await db.select().from(taskCompletionsTable)
    .where(and(eq(taskCompletionsTable.userId, userId), eq(taskCompletionsTable.taskId, id)));
  if (existing) {
    res.status(400).json({ error: "Task already completed" }); return;
  }

  await db.insert(taskCompletionsTable).values({ userId, taskId: id });

  const reward = Number(task.reward);
  await db.insert(earningsTable).values({
    userId, amount: reward.toString(), type: "task",
    description: `Task completed: ${task.title}`,
  });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const newBalance = Number(user?.balance ?? 0) + reward;
  const newTotalEarned = Number(user?.totalEarned ?? 0) + reward;
  await db.update(usersTable).set({
    balance: newBalance.toString(), totalEarned: newTotalEarned.toString(),
  }).where(eq(usersTable.id, userId));

  res.json({ amount: reward, newBalance, message: `Earned KSH ${reward} for completing task!` });
});

export default router;
