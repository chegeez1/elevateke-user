interface DepositConfirmationEmailParams {
  to: string;
  name: string;
  message: string;
}

export async function sendDepositConfirmationEmail({
  to,
  name,
  message,
}: DepositConfirmationEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[mailer] RESEND_API_KEY is not set — deposit confirmation email not sent to", to);
    return;
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "ElevateKe <noreply@elevateke.com>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Deposit Confirmed — ElevateKe",
      text: `Hello ${name},\n\n${message}\n\nThank you for investing with ElevateKe.`,
      html: `<p>Hello ${name},</p><p>${message.replace(/\. /g, ".</p><p>")}</p><p>Thank you for investing with ElevateKe.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error ${response.status}: ${body}`);
  }
}
