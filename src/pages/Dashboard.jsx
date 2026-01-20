import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, CheckCircle, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, role } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && role === "customer") {
      fetchCustomerData();
    } else if (user && role === "provider") {
      fetchProviderData();
    } else {
      setLoading(false);
    }
  }, [user, role]);

  const fetchCustomerData = async () => {
    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        services (name),
        providers (business_name)
      `)
      .eq("customer_id", user.id)
      .order("appointment_date", { ascending: true })
      .limit(5);

    const { data: statsData } = await supabase
      .from("appointments")
      .select("status")
      .eq("customer_id", user.id);

    if (appointmentsData) {
      setAppointments(appointmentsData);
    }

    if (statsData) {
      setStats({
        total: statsData.length,
        pending: statsData.filter(a => a.status === "pending").length,
        confirmed: statsData.filter(a => a.status === "confirmed").length,
        completed: statsData.filter(a => a.status === "completed").length,
      });
    }

    setLoading(false);
  };

  const fetchProviderData = async () => {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!provider) {
      setLoading(false);
      return;
    }

    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        services (name),
        profiles:customer_id (full_name)
      `)
      .eq("provider_id", provider.id)
      .order("appointment_date", { ascending: true })
      .limit(5);

    const { data: statsData } = await supabase
      .from("appointments")
      .select("status")
      .eq("provider_id", provider.id);

    if (appointmentsData) {
      setAppointments(appointmentsData);
    }

    if (statsData) {
      setStats({
        total: statsData.length,
        pending: statsData.filter(a => a.status === "pending").length,
        confirmed: statsData.filter(a => a.status === "confirmed").length,
        completed: statsData.filter(a => a.status === "completed").length,
      });
    }

    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };
    return <Badge variant={variants[status] || "default"} className="capitalize">{status}</Badge>;
  };

  if (role === "admin") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Please use the admin section to manage the platform.</p>
          <Button asChild>
            <Link to="/admin">Go to Admin Panel</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">
            {role === "provider" ? "Provider Dashboard" : "Welcome back!"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {role === "provider" 
              ? "Manage your appointments and availability" 
              : "Book and manage your appointments"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{appointments.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{appointments.filter(a => a.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold">{appointments.filter(a => a.status === 'confirmed').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{appointments.filter(a => a.status === 'completed').length}</p>
                </div>
                <XCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4">
          {role === "customer" ? (
            <Button asChild>
              <Link to="/book">
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link to="/provider/availability">
                  <Clock className="h-4 w-4 mr-2" />
                  Manage Availability
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/provider/appointments">
                  View All Appointments
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>Your latest appointments at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No appointments yet</p>
                {role === "customer" && (
                  <Button asChild variant="link" className="mt-2">
                    <Link to="/book">Book your first appointment</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{apt.services?.name || (role === "provider" ? apt.profiles?.full_name : apt.providers?.business_name)}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.appointment_date), "MMM d, yyyy")} at {apt.start_time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(apt.status)}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

