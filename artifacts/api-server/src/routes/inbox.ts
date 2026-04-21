import { Router, type IRouter } from "express";
import { db, inboxMessagesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/inbox", authenticate, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const messages = await db.select().from(inboxMessagesTable)
    .where(eq(inboxMessagesTable.userId, userId))
    .orderBy(desc(inboxMessagesTable.createdAt));
  res.json(messages.map(m => ({
    id: m.id, title: m.title, content: m.content,
    isRead: m.isRead, createdAt: m.createdAt.toISOString(),
  })));
});

router.patch("/inbox/:id/read", authenticate, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.update(inboxMessagesTable).set({ isRead: true })
    .where(and(eq(inboxMessagesTable.id, id), eq(inboxMessagesTable.userId, userId)));
  res.json({ success: true, message: "Message marked as read" });
});

export default router;
