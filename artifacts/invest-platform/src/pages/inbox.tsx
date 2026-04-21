import { Layout } from "@/components/layout";
import { useGetInbox, useMarkMessageRead } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, MailOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Inbox() {
  const { data: messages, isLoading } = useGetInbox();
  const markReadMut = useMarkMessageRead();
  const queryClient = useQueryClient();

  const handleRead = (id: number, isRead: boolean) => {
    if (isRead) return;
    markReadMut.mutate({ messageId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-500">System messages and notifications.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading messages...</div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map(msg => (
              <Card 
                key={msg.id} 
                className={`cursor-pointer transition-colors ${!msg.isRead ? 'border-primary/50 bg-primary/5' : 'hover:bg-gray-50'}`}
                onClick={() => handleRead(msg.id, msg.isRead)}
              >
                <CardContent className="p-4 sm:p-6 flex gap-4">
                  <div className="mt-1">
                    {!msg.isRead ? <Mail className="text-primary" /> : <MailOpen className="text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h3 className={`font-semibold ${!msg.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{msg.title}</h3>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
                        {!msg.isRead && <Badge>New</Badge>}
                      </div>
                    </div>
                    <p className={`text-sm ${!msg.isRead ? 'text-gray-800' : 'text-gray-500'}`}>{msg.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-xl border border-dashed text-gray-500">
            <MailOpen className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Your inbox is empty.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
