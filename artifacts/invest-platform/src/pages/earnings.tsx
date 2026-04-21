import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetEarnings, useClaimDailyEarnings, useReinvestEarnings, useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { History, Coins, ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Earnings() {
  const { data: earnings, isLoading } = useGetEarnings();
  const { data: summary } = useGetDashboardSummary();
  const claimMut = useClaimDailyEarnings();
  const reinvestMut = useReinvestEarnings();
  const queryClient = useQueryClient();

  const [reinvestOpen, setReinvestOpen] = useState(false);
  const [reinvestAmount, setReinvestAmount] = useState("");

  const handleClaim = () => {
    claimMut.mutate(undefined, {
      onSuccess: (res) => {
        toast.success("Earnings claimed!", { description: res.message });
        queryClient.invalidateQueries({ queryKey: ["/api/earnings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      },
      onError: (err) => {
        toast.error("Failed to claim", { description: err.data?.error || "No earnings available to claim." });
      }
    });
  };

  const handleReinvest = (e: React.FormEvent) => {
    e.preventDefault();
    reinvestMut.mutate({ data: { amount: Number(reinvestAmount) } }, {
      onSuccess: (res) => {
        toast.success("Successfully reinvested!", { description: res.message });
        setReinvestOpen(false);
        setReinvestAmount("");
        queryClient.invalidateQueries({ queryKey: ["/api/earnings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      },
      onError: (err) => {
        toast.error("Reinvestment failed", { description: err.data?.error || "Unknown error" });
      }
    });
  };

  const getEarningColor = (type: string) => {
    switch(type) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'referral': return 'bg-purple-100 text-purple-800';
      case 'task': return 'bg-green-100 text-green-800';
      case 'login_bonus': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-500">Track and manage your profits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <p className="text-primary font-medium flex items-center gap-2 mb-2">
                  <Coins size={18} /> Available Daily Earnings
                </p>
                <h3 className="text-3xl font-bold text-gray-900">
                  KSH {summary ? formatNumber(summary.todayEarned) : '0'}
                </h3>
                {summary?.nextEarningAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Next earning available at: {new Date(summary.nextEarningAt).toLocaleString()}
                  </p>
                )}
              </div>
              <Button onClick={handleClaim} disabled={claimMut.isPending} className="mt-6 w-full">
                {claimMut.isPending ? "Claiming..." : "Claim Daily Earnings"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <p className="text-gray-600 font-medium flex items-center gap-2 mb-2">
                  <ArrowRightLeft size={18} /> Reinvest Balance
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Turn your balance back into an active deposit to compound your wealth faster without withdrawal fees.
                </p>
              </div>
              <Button variant="outline" onClick={() => setReinvestOpen(true)} className="w-full">
                Reinvest Balance
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History size={20} /> Earnings History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading history...</div>
            ) : earnings && earnings.length > 0 ? (
              <div className="space-y-4">
                {earnings.map(e => (
                  <div key={e.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900">{e.description}</span>
                      <span className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-green-600">+ KSH {formatNumber(e.amount)}</span>
                      <Badge variant="secondary" className={`${getEarningColor(e.type)} border-none text-[10px]`}>
                        {e.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed text-gray-500">
                No earnings yet. Start investing or completing tasks!
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={reinvestOpen} onOpenChange={setReinvestOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reinvest Earnings</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReinvest} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md text-sm mb-4">
                Available Balance: <strong className="text-primary">KSH {formatNumber(summary?.balance || 0)}</strong>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reinvestAmount">Amount to Reinvest (KSH)</Label>
                <Input id="reinvestAmount" type="number" min="100" max={summary?.balance} value={reinvestAmount} onChange={e => setReinvestAmount(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setReinvestOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={reinvestMut.isPending}>
                  {reinvestMut.isPending ? "Processing..." : "Reinvest"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
