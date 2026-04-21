import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  multiplier: integer("multiplier").notNull().default(1),
  durationMins: integer("duration_mins").notNull(),
  direction: text("direction").notNull(),
  result: text("result"),
  profitLoss: numeric("profit_loss", { precision: 15, scale: 2 }),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const tradeSettingsTable = pgTable("trade_settings", {
  id: serial("id").primaryKey(),
  direction: text("direction").notNull().default("up"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true, startedAt: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
export type TradeSettings = typeof tradeSettingsTable.$inferSelect;
