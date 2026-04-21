import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const earningsTable = pgTable("earnings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  depositId: integer("deposit_id"),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEarningSchema = createInsertSchema(earningsTable).omit({ id: true, createdAt: true });
export type InsertEarning = z.infer<typeof insertEarningSchema>;
export type Earning = typeof earningsTable.$inferSelect;
