import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X } from "lucide-react";
import { format } from "date-fns";




export default function AdminUsers() {
  const { role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (role === "admin") { fetchUsers(); fetchProviders(); } }, [role]);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id, email, full_name, created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (profiles) {
      setUsers(profiles.map(p => ({ ...p, role: roles?.find(r => r.user_id === p.id)?.role || null })));
    }
    setLoading(false);
  };

  const fetchProviders = async () => {
    const { data } = await supabase.from("providers").select("*");
    if (data) setProviders(data);
  };

  const toggleProviderApproval = async (providerId, approved) => {
    const { error } = await supabase.from("providers").update({ is_approved: approved }).eq("id", providerId);
    if (!error) { toast({ title: approved ? "Approved" : "Unapproved" }); fetchProviders(); }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">User Management</h1>

        <Card>
          <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Providers</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.business_name}</TableCell>
                    <TableCell>
                      <Badge variant={p.is_approved ? "default" : "secondary"}>{p.is_approved ? "Approved" : "Pending"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant={p.is_approved ? "outline" : "default"} onClick={() => toggleProviderApproval(p.id, !p.is_approved)}>
                        {p.is_approved ? <><X className="h-4 w-4 mr-1" />Revoke</> : <><Check className="h-4 w-4 mr-1" />Approve</>}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

