import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Clock } from "lucide-react";

export default function AdminServices() {
  const { role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", duration_minutes: "30", price: "", category_id: "" });

  useEffect(() => { if (role === "admin") { fetchCategories(); fetchServices(); } }, [role]);

  const fetchCategories = async () => { const { data } = await supabase.from("service_categories").select("*"); if (data) setCategories(data); };
  const fetchServices = async () => { const { data } = await supabase.from("services").select("*, category:service_categories(name)"); if (data) setServices(data); setLoading(false); };

  const handleSubmit = async () => {
    const { error } = await supabase.from("services").insert({
      name: form.name, description: form.description,
      duration_minutes: parseInt(form.duration_minutes),
      price: form.price ? parseFloat(form.price) : null,
      category_id: form.category_id || null,
    });
    if (!error) { toast({ title: "Service created" }); setDialogOpen(false); setForm({ name: "", description: "", duration_minutes: "30", price: "", category_id: "" }); fetchServices(); }
    else toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const toggleActive = async (id, active) => {
    await supabase.from("services").update({ is_active: active }).eq("id", id);
    fetchServices();
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-display font-bold">Service Management</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Service</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Service</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} /></div>
                  <div><Label>Price ($)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                </div>
                <div><Label>Category</Label>
                  <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSubmit} className="w-full">Create Service</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>All Services</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>{s.categories?.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{s.duration_minutes}m</Badge>
                      </TableCell>
                      <TableCell>{s.price ? `$${s.price}` : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => toggleActive(s.id, !s.is_active)}>{s.is_active ? "Deactivate" : "Activate"}</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

