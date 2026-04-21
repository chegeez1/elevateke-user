import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Activity, DollarSign, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => customFetch<any>("/api/admin/stats"),
  });

  const handleExport = async () => {
    try {
      const response = await customFetch<any>("/api/admin/reports/export");
      // Create a blob and download
      const jsonStr = JSON.stringify(response, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Report exported successfully" });
    } catch (err: any) {
      toast({ title: "Failed to export report", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and export platform performance reports.</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Full Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Deposits (Lifetime)</div>
              <div className="text-2xl font-bold">KSH {(stats?.totalDeposits || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Withdrawals</div>
              <div className="text-2xl font-bold">KSH {(stats?.totalWithdrawals || 0).toLocaleString()}</div>
            </div>
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">Net Platform Revenue</div>
              <div className="text-2xl font-bold text-emerald-600">KSH {(stats?.netRevenue || 0).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">User Analytics</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Registered Users</div>
              <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Suspended Accounts</div>
              <div className="text-xl font-bold text-destructive">{stats?.suspendedUsers || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Referrals Made</div>
              <div className="text-xl font-bold">{stats?.totalReferrals || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">New Registrations Today</div>
              <div className="text-2xl font-bold text-primary">{stats?.todayNewUsers || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Deposits Volume Today</div>
              <div className="text-xl font-bold">KSH {(stats?.todayDeposits || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Withdrawals Requested Today</div>
              <div className="text-xl font-bold">KSH {(stats?.todayWithdrawals || 0).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Comprehensive Data Export</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Export a full JSON dump containing all user balances, transaction histories, and platform metrics for external analysis.
          </p>
          <Button variant="outline" onClick={handleExport}>Download JSON Report</Button>
        </CardContent>
      </Card>
    </div>
  );
}
