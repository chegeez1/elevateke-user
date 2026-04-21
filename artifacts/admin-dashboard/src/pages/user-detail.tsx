import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Ban, CheckCircle, Wallet, History, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceNote, setBalanceNote] = useState("");
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => customFetch<any>(`/api/admin/users/${id}`),
  });

  const adjustBalance = useMutation({
    mutationFn: (data: { amount: number, note: string }) => 
      customFetch(`/api/admin/users/${id}/adjust-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      setIsAdjustOpen(false);
      setBalanceAmount("");
      setBalanceNote("");
      toast({ title: "Balance adjusted successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to adjust balance", description: err.message, variant: "destructive" });
    }
  });

  const toggleSuspend = useMutation({
    mutationFn: (suspend: boolean) => 
      customFetch(`/api/admin/users/${id}/${suspend ? 'suspend' : 'unsuspend'}`, { method: "POST" }),
    onSuccess: (_, suspend) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      toast({ title: `User ${suspend ? 'suspended' : 'unsuspended'}` });
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading user details...</div>;
  if (!detail || !detail.user) return <div className="p-8 text-center text-destructive">User not found.</div>;

  const user = detail.user;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground">{user.email} • {user.phone}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button 
            variant={user.isSuspended ? "default" : "destructive"}
            onClick={() => toggleSuspend.mutate(!user.isSuspended)}
            disabled={toggleSuspend.isPending}
          >
            {user.isSuspended ? <CheckCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
            {user.isSuspended ? "Unsuspend User" : "Suspend User"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Account Status</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Current Balance</div>
                <div className="text-2xl font-bold">KSH {user.balance?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Deposited</div>
                <div className="text-xl font-semibold">KSH {user.totalDeposited?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Earned</div>
                <div className="text-xl font-semibold">KSH {user.totalEarned?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">VIP Level</div>
                <div className="text-xl font-semibold font-mono">{user.vipLevel}</div>
              </div>
            </div>

            <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mt-4" variant="outline">
                  <Wallet className="mr-2 h-4 w-4" />
                  Adjust Balance manually
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adjust User Balance</DialogTitle>
                  <DialogDescription>
                    Add or deduct funds directly from the user's account. Use negative numbers to deduct.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (KSH)</label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 5000 or -1000"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reason Note</label>
                    <Input 
                      placeholder="Reason for adjustment"
                      value={balanceNote}
                      onChange={(e) => setBalanceNote(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={() => adjustBalance.mutate({ amount: Number(balanceAmount), note: balanceNote })}
                    disabled={!balanceAmount || isNaN(Number(balanceAmount)) || adjustBalance.isPending}
                  >
                    Confirm Adjustment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center py-8">
                Detailed transaction history to be implemented.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
