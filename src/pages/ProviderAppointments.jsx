import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Check, X, Loader2 } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";

export default function ProviderAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState(null);

  useEffect(() => {
    if (user) fetchProvider();
  }, [user]);

  const fetchProvider = async () => {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (provider) {
      setProviderId(provider.id);
      fetchAppointments(provider.id);
    } else {
      setLoading(false);
    }
  };

  const fetchAppointments = async (provId) => {
    const { data } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        customer_id,
        services (name, duration_minutes, price)
      `)
      .eq("provider_id", provId)
      .order("appointment_date", { ascending: true });

    if (data) {
      // Fetch customer profiles separately
      const customerIds = [...new Set(data.map(a => a.customer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", customerIds);

      const appointmentsWithProfiles = data.map(apt => ({
        ...apt,
        profiles: profiles?.find(p => p.id === apt.customer_id) || null,
      }));

      setAppointments(appointmentsWithProfiles);
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update appointment", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Appointment ${status}` });
      if (providerId) fetchAppointments(providerId);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"} className="capitalize">{status}</Badge>;
  };

  const pendingAppointments = appointments.filter(apt => apt.status === "pending");
  const upcomingAppointments = appointments.filter(
    apt => !isPast(parseISO(`${apt.appointment_date}T${apt.end_time}`)) && apt.status === "confirmed"
  );
  const pastAppointments = appointments.filter(
    apt => isPast(parseISO(`${apt.appointment_date}T${apt.end_time}`)) || apt.status === "cancelled" || apt.status === "rejected" || apt.status === "completed"
  );

  const AppointmentCard = ({ appointment, showActions = false }) => (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{appointment.profiles?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{appointment.profiles?.email}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">{appointment.services?.name}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(parseISO(appointment.appointment_date), "EEEE, MMMM d, yyyy")}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(appointment.status)}
            {showActions && appointment.status === "pending" && (
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm" 
                  onClick={() => updateStatus(appointment.id, "confirmed")}
                  className="gap-1"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateStatus(appointment.id, "rejected")}
                  className="gap-1 text-destructive"
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            )}
            {appointment.status === "confirmed" && !isPast(parseISO(`${appointment.appointment_date}T${appointment.end_time}`)) && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateStatus(appointment.id, "completed")}
                className="mt-2"
              >
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage your bookings</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastAppointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No pending requests
                  </CardContent>
                </Card>
              ) : (
                pendingAppointments.map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} showActions />
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No upcoming appointments
                  </CardContent>
                </Card>
              ) : (
                upcomingAppointments.map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No past appointments
                  </CardContent>
                </Card>
              ) : (
                pastAppointments.map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}


