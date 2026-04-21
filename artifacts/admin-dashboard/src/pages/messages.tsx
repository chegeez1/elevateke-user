import { useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Users } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

const messageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Message content is required"),
  isBroadcast: z.boolean().default(false),
  userId: z.string().optional(),
}).refine((data) => {
  if (!data.isBroadcast && !data.userId) {
    return false;
  }
  return true;
}, {
  message: "User ID is required when not broadcasting",
  path: ["userId"],
});

type FormValues = z.infer<typeof messageSchema>;

export default function Messages() {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      title: "",
      content: "",
      isBroadcast: false,
      userId: "",
    },
  });

  const isBroadcast = form.watch("isBroadcast");

  const sendMessage = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        title: data.title,
        content: data.content,
        userId: data.isBroadcast ? null : Number(data.userId),
      };
      
      return customFetch("/api/admin/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({ title: "Message sent successfully" });
      form.reset({
        title: "",
        content: "",
        isBroadcast: false,
        userId: "",
      });
    },
    onError: (err: any) => {
      toast({ title: "Failed to send message", description: err.message, variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Send direct inbox messages to specific users or broadcast to everyone.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Compose Message
          </CardTitle>
          <CardDescription>
            Messages appear in the user's platform inbox.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => sendMessage.mutate(d))} className="space-y-6">
              
              <FormField
                control={form.control}
                name="isBroadcast"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/50">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" /> Broadcast to All Users
                      </FormLabel>
                      <FormDescription>
                        Send this message to every registered user on the platform.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!isBroadcast && (
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target User ID</FormLabel>
                      <FormControl><Input placeholder="e.g. 42" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Subject</FormLabel>
                    <FormControl><Input placeholder="Subject line" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Content</FormLabel>
                    <FormControl><Textarea className="min-h-[200px]" placeholder="Type your message here..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={sendMessage.isPending} className="w-full sm:w-auto">
                  {sendMessage.isPending ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
