import { Layout } from "@/components/layout";
import { useGetReferrals } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Users, Copy, Share2, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Referrals() {
  const { data: refInfo, isLoading } = useGetReferrals();

  const handleCopy = () => {
    if (!refInfo) return;
    navigator.clipboard.writeText(refInfo.referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>
          <p className="text-gray-500">Invite friends and earn bonuses when they invest.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading referral data...</div>
        ) : refInfo ? (
          <>
            <Card className="bg-primary text-primary-foreground border-none">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Share2 /> Your Referral Link</h3>
                <div className="flex gap-2">
                  <Input value={refInfo.referralLink} readOnly className="bg-primary-foreground/10 border-primary-foreground/20 text-white" />
                  <Button variant="secondary" onClick={handleCopy}><Copy size={16} className="mr-2"/> Copy</Button>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-primary-foreground/80">
                  <span>Code: <strong className="text-white">{refInfo.referralCode}</strong></span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                    <Users size={24} />
                  </div>
                  <h4 className="text-gray-500 font-medium">Total Network</h4>
                  <p className="text-3xl font-bold mt-1">{refInfo.totalReferrals}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                    <Award size={24} />
                  </div>
                  <h4 className="text-gray-500 font-medium">Total Earned</h4>
                  <p className="text-3xl font-bold mt-1 text-green-600">KSH {formatNumber(refInfo.totalReferralEarnings)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col justify-center">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Level 1 (Direct)</span>
                    <Badge variant="secondary">{refInfo.level1Count}</Badge>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-gray-600">Level 2 (Indirect)</span>
                    <Badge variant="outline">{refInfo.level2Count}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>My Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                {refInfo.referrals.length > 0 ? (
                  <div className="space-y-4">
                    {refInfo.referrals.map(ref => (
                      <div key={ref.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <div className="font-semibold text-gray-900">{ref.name}</div>
                          <div className="text-xs text-gray-500 mt-1">Joined {new Date(ref.joinedAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant={ref.level === 1 ? 'default' : 'secondary'} className="mb-1">Level {ref.level}</Badge>
                          <div className="text-sm font-medium text-green-600">+ KSH {formatNumber(ref.bonusAmount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed">
                    <Users className="mx-auto text-gray-400 mb-3" size={32} />
                    <h4 className="font-medium text-gray-900">No referrals yet</h4>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">Share your link with friends to start earning referral bonuses!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
