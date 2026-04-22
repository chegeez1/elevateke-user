import { db, usersTable, inboxMessagesTable } from "@workspace/db";
import { isNull, lt, eq, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const REMINDER_TITLE = "Don't miss out — fund your ElevateKe account!";

const REMINDER_CONTENT = `Hi there,

We noticed you haven't made your first deposit yet. Your ElevateKe account is ready — all you need to do is fund it and start earning!

Here's what you'll unlock once you deposit:
• Daily returns of up to 5% depending on your investment plan
• Bonus earnings from our referral program  
• VIP tier upgrades with higher daily earning rates

Getting started takes less than 2 minutes via M-Pesa STK Push.

Head to your Deposit page, choose a plan that suits you, and start growing your money today.

If you have any questions, our support team is happy to help — just reply to this message.

— The ElevateKe Team`;

export async function sendDepositReminders(): Promise<void> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const undeposited = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.isAdmin, false),
        eq(usersTable.isSuspended, false),
        lt(usersTable.createdAt, twentyFourHoursAgo),
        isNull(usersTable.depositReminderSentAt),
        sql`${usersTable.totalDeposited} = 0`,
      ),
    );

  if (undeposited.length === 0) return;

  logger.info({ count: undeposited.length }, "Sending deposit reminder messages");

  for (const user of undeposited) {
    try {
      await db.insert(inboxMessagesTable).values({
        userId: user.id,
        title: REMINDER_TITLE,
        content: REMINDER_CONTENT,
      });

      await db
        .update(usersTable)
        .set({ depositReminderSentAt: new Date() })
        .where(eq(usersTable.id, user.id));

      logger.info({ userId: user.id }, "Deposit reminder sent");
    } catch (err) {
      logger.error({ err, userId: user.id }, "Failed to send deposit reminder for user");
    }
  }
}
