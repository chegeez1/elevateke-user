import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inboxMessagesTable = pgTable("inbox_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInboxMessageSchema = createInsertSchema(inboxMessagesTable).omit({ id: true, createdAt: true });
export type InsertInboxMessage = z.infer<typeof insertInboxMessageSchema>;
export type InboxMessage = typeof inboxMessagesTable.$inferSelect;
