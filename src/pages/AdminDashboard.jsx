import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Briefcase, Calendar, TrendingUp, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { role, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ users: 0, providers: 0, services: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "admin") fetchStats();
  }, [role]);

  const fetchStats = async () => {
    const [users, providers, services, appointments] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("providers").select("id", { count: "exact", head: true }),
      supabase.from("services").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      users: users.count || 0,
      providers: providers.count || 0,
      services: services.count || 0,
      appointments: appointments.count || 0,
    });
    setLoading(false);
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.users}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Providers</p>
                  <p className="text-2xl font-bold">{stats.providers}</p>
                </div>
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="text-2xl font-bold">{stats.services}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Appointments</p>
                  <p className="text-2xl font-bold">{stats.appointments}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/admin/users"><Card className="hover:border-primary/50 cursor-pointer"><CardHeader><CardTitle>Manage Users</CardTitle><CardDescription>View and manage all users</CardDescription></CardHeader></Card></Link>
          <Link to="/admin/services"><Card className="hover:border-primary/50 cursor-pointer"><CardHeader><CardTitle>Manage Services</CardTitle><CardDescription>Add and edit services</CardDescription></CardHeader></Card></Link>
          <Link to="/admin/analytics"><Card className="hover:border-primary/50 cursor-pointer"><CardHeader><CardTitle>Analytics</CardTitle><CardDescription>View platform analytics</CardDescription></CardHeader></Card></Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

