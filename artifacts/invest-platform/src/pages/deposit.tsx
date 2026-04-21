import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetPlans, useCreateDeposit, useVerifyDeposit, useGetDeposits } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

export default function Deposit() {
  const { data: plans, isLoading: loadingPlans } = useGetPlans();
  const { data: deposits, isLoading: loadingDeposits } = useGetDeposits();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentStep, setPaymentStep] = useState<"form" | "paystack">("form");
  const [currentReference, setCurrentReference] = useState("");
  const [currentAuthUrl, setCurrentAuthUrl] = useState("");

  const createDepositMut = useCreateDeposit();
  const verifyDepositMut = useVerifyDeposit();
  const queryClient = useQueryClient();

  const handleInitiateDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    
    createDepositMut.mutate({ data: { planId: selectedPlan, amount: Number(amount), phone } }, {
      onSuccess: (res) => {
        setCurrentReference(res.reference);
        setCurrentAuthUrl(res.paystackAuthUrl);
        setPaymentStep("paystack");
      },
      onError: (err) => {
        toast.error("Failed to initiate deposit", { description: err.data?.error || "Unknown error" });
      }
    });
  };

  const handleVerify = () => {
    verifyDepositMut.mutate({ data: { reference: currentReference } }, {
      onSuccess: () => {
        toast.success("Deposit successful!");
        setSelectedPlan(null);
        setPaymentStep("form");
        setAmount("");
        queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      },
      onError: (err) => {
        toast.error("Verification failed", { description: err.data?.error || "Payment might not be complete yet." });
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deposit</h1>
          <p className="text-gray-500">Invest in a plan to earn daily returns.</p>
        </div>

        <Tabs defaultValue="plans">
          <TabsList className="mb-4">
            <TabsTrigger value="plans">Deposit Plans</TabsTrigger>
            <TabsTrigger value="history">My Deposits</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            {loadingPlans ? (
              <div className="text-center p-8">Loading plans...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans?.map(plan => (
                  <Card key={plan.id} className="flex flex-col relative overflow-hidden border-2 hover:border-primary transition-colors">
                    {plan.bonusPercent > 0 && (
                      <div className="absolute top-0 right-0 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        {plan.bonusPercent}% Bonus
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <p className="text-gray-500 text-sm">{plan.description}</p>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div className="flex justify-between pb-2 border-b">
                        <span className="text-gray-500">Daily Rate</span>
                        <span className="font-bold text-green-600">{(plan.dailyRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b">
                        <span className="text-gray-500">Duration</span>
                        <span className="font-bold">{plan.durationDays} Days</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b">
                        <span className="text-gray-500">Min Amount</span>
                        <span className="font-bold">KSH {formatNumber(plan.minAmount)}</span>
                      </div>
                      {plan.maxAmount && (
                        <div className="flex justify-between pb-2 border-b">
                          <span className="text-gray-500">Max Amount</span>
                          <span className="font-bold">KSH {formatNumber(plan.maxAmount)}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => {
                        setSelectedPlan(plan.id);
                        setAmount(plan.minAmount.toString());
                      }}>
                        Invest Now
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Deposit History</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDeposits ? (
                  <div className="text-center p-4">Loading...</div>
                ) : deposits && deposits.length > 0 ? (
                  <div className="space-y-4">
                    {deposits.map(dep => (
                      <div key={dep.id} className="flex justify-between items-center p-4 border rounded-lg bg-gray-50">
                        <div>
                          <div className="font-bold">{dep.planName}</div>
                          <div className="text-sm text-gray-500">{new Date(dep.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">KSH {formatNumber(dep.amount)}</div>
                          <Badge variant={dep.status === 'active' ? 'default' : dep.status === 'completed' ? 'secondary' : 'outline'}>
                            {dep.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500">No deposits found.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deposit via M-Pesa</DialogTitle>
              <DialogDescription>
                Enter amount and M-Pesa phone number to proceed.
              </DialogDescription>
            </DialogHeader>
            
            {paymentStep === "form" ? (
              <form onSubmit={handleInitiateDeposit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (KSH)</Label>
                  <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="e.g. 0712345678" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedPlan(null)}>Cancel</Button>
                  <Button type="submit" disabled={createDepositMut.isPending}>
                    {createDepositMut.isPending ? "Processing..." : "Proceed to Payment"}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-6 text-center py-4">
                <p className="text-gray-600">Click the button below to complete payment via Paystack.</p>
                <Button className="w-full" size="lg" asChild>
                  <a href={currentAuthUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    Pay KSH {formatNumber(Number(amount))} <ExternalLink size={16} />
                  </a>
                </Button>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-4">After payment is successful, click verify below.</p>
                  <Button variant="secondary" className="w-full" onClick={handleVerify} disabled={verifyDepositMut.isPending}>
                    {verifyDepositMut.isPending ? "Verifying..." : "I've completed payment"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
