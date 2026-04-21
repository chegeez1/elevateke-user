import { Layout } from "@/components/layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FAQ() {
  const faqs = [
    {
      q: "How do I make a deposit?",
      a: "Go to the Deposit page, select a plan that fits your budget, enter the amount and your M-Pesa number. You will be redirected to Paystack to complete the secure M-Pesa payment. After payment, click the 'Verify' button."
    },
    {
      q: "When can I withdraw my earnings?",
      a: "You can withdraw your earnings anytime as long as your balance is above the minimum withdrawal amount of KSH 100. Withdrawals are processed directly to your registered M-Pesa number."
    },
    {
      q: "What is VIP Level?",
      a: "Your VIP Level (Bronze, Silver, Gold, Platinum) increases based on your total deposited amount. Higher VIP levels unlock better daily rates, exclusive tasks, and priority support."
    },
    {
      q: "How does the trading feature work?",
      a: "The trade feature allows you to predict if the market price will go UP or DOWN within a specific timeframe (1, 5, or 15 mins). You choose a multiplier (1x, 2x, 3x) which determines your potential profit but also your risk. If your prediction is correct, you win the profit. If incorrect, you lose the trade amount."
    },
    {
      q: "How do referral bonuses work?",
      a: "Share your unique referral link with friends. When they register and make their first deposit, you earn a percentage bonus. You earn on direct referrals (Level 1) and their referrals (Level 2)."
    }
  ];

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <p className="text-gray-500 mt-2">Find answers to common questions about ElevateKe.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General Help</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
