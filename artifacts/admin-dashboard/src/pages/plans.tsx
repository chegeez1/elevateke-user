import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const planSchema = z.object({
  name: z.string().min(1, "Name is required"),
  minAmount: z.coerce.number().min(1),
  maxAmount: z.coerce.number().optional().nullable(),
  dailyRate: z.coerce.number().min(0),
  durationDays: z.coerce.number().min(1),
  bonusPercent: z.coerce.number().min(0),
  isActive: z.boolean(),
  description: z.string().optional().nullable(),
});

type PlanFormValues = z.infer<typeof planSchema>;

export default function Plans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => customFetch<any[]>("/api/admin/plans"),
  });

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      minAmount: 100,
      dailyRate: 1,
      durationDays: 30,
      bonusPercent: 0,
      isActive: true,
      description: "",
    },
  });

  const createPlan = useMutation({
    mutationFn: (data: PlanFormValues) => 
      customFetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      setIsDialogOpen(false);
      toast({ title: "Plan created successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error creating plan", description: err.message, variant: "destructive" });
    }
  });

  const updatePlan = useMutation({
    mutationFn: ({ id, data }: { id: number, data: PlanFormValues }) => 
      customFetch(`/api/admin/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      setIsDialogOpen(false);
      toast({ title: "Plan updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error updating plan", description: err.message, variant: "destructive" });
    }
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: number, isActive: boolean }) => 
      customFetch(`/api/admin/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
    }
  });

  const onSubmit = (data: PlanFormValues) => {
    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, data });
    } else {
      createPlan.mutate(data);
    }
  };

  const openNewPlan = () => {
    setEditingPlan(null);
    form.reset({
      name: "",
      minAmount: 100,
      maxAmount: null,
      dailyRate: 1,
      durationDays: 30,
      bonusPercent: 0,
      isActive: true,
      description: "",
    });
    setIsDialogOpen(true);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      minAmount: plan.minAmount,
      maxAmount: plan.maxAmount,
      dailyRate: plan.dailyRate,
      durationDays: plan.durationDays,
      bonusPercent: plan.bonusPercent,
      isActive: plan.isActive,
      description: plan.description || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deposit Plans</h1>
          <p className="text-muted-foreground">Manage investment packages available to users.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewPlan}>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Amount (KSH)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Amount (KSH, Optional)</FormLabel>
                        <FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dailyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Rate (%)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="durationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Days)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bonusPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bonus (%)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createPlan.isPending || updatePlan.isPending}>
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Min Amount</TableHead>
              <TableHead className="text-right">Daily Rate</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24">Loading plans...</TableCell></TableRow>
            ) : plans.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No plans found.</TableCell></TableRow>
            ) : (
              plans.map((plan: any) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell className="text-right">KSH {plan.minAmount?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{plan.dailyRate}%</TableCell>
                  <TableCell className="text-right">{plan.durationDays} Days</TableCell>
                  <TableCell>
                    <Switch 
                      checked={plan.isActive}
                      onCheckedChange={(checked) => toggleStatus.mutate({ id: plan.id, isActive: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEditPlan(plan)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
