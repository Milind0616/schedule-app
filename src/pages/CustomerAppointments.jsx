import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, User, X, Loader2 } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";

export default function CustomerAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        services (name, duration_minutes, price),
        providers (business_name, bio)
      `)
      .eq("customer_id", user.id)
      .order("appointment_date", { ascending: true });

    if (data) setAppointments(data);
    setLoading(false);
  };

  const handleCancelClick = (id) => {
    setCancellingId(id);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancellingId) return;

    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", cancellingId);

    if (error) {
      toast({ title: "Error", description: "Failed to cancel appointment", variant: "destructive" });
    } else {
      toast({ title: "Cancelled", description: "Your appointment has been cancelled" });
      fetchAppointments();
    }

    setShowCancelDialog(false);
    setCancellingId(null);
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

  const upcomingAppointments = appointments.filter(
    apt => !isPast(parseISO(`${apt.appointment_date}T${apt.end_time}`)) && apt.status !== "cancelled" && apt.status !== "rejected"
  );

  const pastAppointments = appointments.filter(
    apt => isPast(parseISO(`${apt.appointment_date}T${apt.end_time}`)) || apt.status === "cancelled" || apt.status === "rejected"
  );

  const AppointmentCard = ({ appointment, showCancel = false }) => (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{appointment.services?.name}</h3>
                <p className="text-sm text-muted-foreground">with {appointment.providers?.business_name}</p>
              </div>
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

            {appointment.notes && (
              <p className="text-sm text-muted-foreground">{appointment.notes}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(appointment.status)}
            {showCancel && (appointment.status === "pending" || appointment.status === "confirmed") && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive"
                onClick={() => handleCancelClick(appointment.id)}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
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
          <h1 className="text-3xl font-display font-bold">My Appointments</h1>
          <p className="text-muted-foreground mt-1">View and manage your bookings</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastAppointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No upcoming appointments</p>
                    <Button asChild variant="link" className="mt-2">
                      <a href="/book">Book an appointment</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                upcomingAppointments.map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} showCancel />
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

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelConfirm} className="bg-destructive text-destructive-foreground">
                Cancel Appointment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}


