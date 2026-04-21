import { pgTable, text, serial, timestamp, numeric, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const depositsTable = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  bonusAmount: numeric("bonus_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  dailyEarning: numeric("daily_earning", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paystackRef: text("paystack_ref"),
  autoRenew: boolean("auto_renew").notNull().default(false),
  lastEarningAt: timestamp("last_earning_at", { withTimezone: true }),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDepositSchema = createInsertSchema(depositsTable).omit({ id: true, createdAt: true });
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Deposit = typeof depositsTable.$inferSelect;
