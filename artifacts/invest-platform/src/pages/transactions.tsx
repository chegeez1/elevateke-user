import { Layout } from "@/components/layout";
import { useGetDeposits, useGetWithdrawals } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Transactions() {
  const { data: deposits, isLoading: loadingDep } = useGetDeposits();
  const { data: withdrawals, isLoading: loadingWith } = useGetWithdrawals();

  const allTx = [
    ...(deposits?.map(d => ({ ...d, type: 'deposit' as const, date: d.createdAt })) || []),
    ...(withdrawals?.map(w => ({ ...w, type: 'withdrawal' as const, date: w.requestedAt })) || [])
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500">Combined history of your deposits and withdrawals.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDep || loadingWith ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : allTx.length > 0 ? (
              <div className="space-y-4">
                {allTx.map(tx => (
                  <div key={`${tx.type}-${tx.id}`} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'deposit' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                      </div>
                      <div>
                        <div className="font-semibold capitalize text-gray-900">
                          {tx.type === 'deposit' ? `Deposit: ${tx.planName}` : 'M-Pesa Withdrawal'}
                        </div>
                        <div className="text-sm text-gray-500">{new Date(tx.date).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${tx.type === 'deposit' ? 'text-gray-900' : 'text-gray-900'}`}>
                        {tx.type === 'deposit' ? '+' : '-'} KSH {formatNumber(tx.amount)}
                      </div>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-lg border-dashed border">
                No transactions found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
