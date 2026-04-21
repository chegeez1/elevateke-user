import { Router, type IRouter } from "express";
import { db, announcementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/announcements", async (_req, res): Promise<void> => {
  const announcements = await db.select().from(announcementsTable)
    .where(eq(announcementsTable.isActive, true));
  res.json(announcements.map(a => ({
    id: a.id, title: a.title, content: a.content,
    isActive: a.isActive, createdAt: a.createdAt.toISOString(),
  })));
});

export default router;
