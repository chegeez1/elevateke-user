import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { TrendingUp, ShieldCheck, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 text-foreground flex flex-col">
      <header className="flex items-center justify-between p-6 max-w-6xl mx-auto w-full">
        <div className="font-bold text-2xl text-primary flex items-center gap-2">
          <TrendingUp className="text-secondary" /> ElevateKe
        </div>
        <div className="flex gap-4">
          <Link href="/login"><Button variant="ghost">Login</Button></Link>
          <Link href="/register"><Button>Get Started</Button></Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-4xl mx-auto mt-12 mb-20">
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Grow Your Wealth.<br/> <span className="text-primary">The Kenyan Way.</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl">
          Deposit via M-Pesa, earn daily returns, trade markets, and complete simple tasks to multiply your capital with ElevateKe.
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/register"><Button size="lg" className="text-lg px-8">Start Investing Now</Button></Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <Zap className="text-secondary h-10 w-10 mb-4" />
            <h3 className="font-bold text-xl mb-2">Daily Returns</h3>
            <p className="text-gray-600">Earn consistent daily percentages on your active deposits.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <TrendingUp className="text-primary h-10 w-10 mb-4" />
            <h3 className="font-bold text-xl mb-2">Live Trading</h3>
            <p className="text-gray-600">Predict market movements and multiply your balance instantly.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <ShieldCheck className="text-green-600 h-10 w-10 mb-4" />
            <h3 className="font-bold text-xl mb-2">Instant M-Pesa</h3>
            <p className="text-gray-600">Seamlessly deposit and withdraw using your M-Pesa account.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
