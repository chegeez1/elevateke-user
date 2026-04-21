import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent successfully!", { description: "Our support team will get back to you shortly." });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contact Support</h1>
          <p className="text-gray-500 mt-2">We're here to help you 24/7.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-none bg-primary text-primary-foreground shadow-lg">
            <CardHeader>
              <CardTitle>Contact Info</CardTitle>
              <CardDescription className="text-primary-foreground/80">Get in touch directly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 mt-4">
              <div className="flex items-start gap-4">
                <Mail className="mt-1 opacity-80" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-sm opacity-80">support@elevateke.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="mt-1 opacity-80" />
                <div>
                  <p className="font-semibold">Phone</p>
                  <p className="text-sm opacity-80">+254 700 000 000</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 opacity-80" />
                <div>
                  <p className="font-semibold">Office</p>
                  <p className="text-sm opacity-80">Westlands, Nairobi<br/>Kenya</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Send a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" required placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" required placeholder="john@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" required placeholder="How can we help?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" required placeholder="Describe your issue..." className="min-h-[150px]" />
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  <Send className="mr-2" size={16} /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
