import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Stethoscope, 
  Sparkles, 
  GraduationCap, 
  Briefcase, 
  Home,
  ArrowLeft,
  ArrowRight,
  Clock,
  Loader2,
  CheckCircle
} from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";

const iconMap = {
  stethoscope: Stethoscope,
  sparkles: Sparkles,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  home: Home,
};

export default function BookAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState("category");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("service_categories").select("*");
    if (data) setCategories(data);
    setLoading(false);
  };

  const fetchServices = async (categoryId) => {
    setLoading(true);
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true);
    if (data) setServices(data);
    setLoading(false);
  };

  const fetchProviders = async (serviceId) => {
    setLoading(true);
    const { data } = await supabase
      .from("provider_services")
      .select(`
        provider_id,
        providers (
          id,
          business_name,
          bio,
          user_id
        )
      `)
      .eq("service_id", serviceId);

    // Also fetch providers who don't have provider_services yet but are approved
    const { data: allProviders } = await supabase
      .from("providers")
      .select(`
        id,
        business_name,
        bio,
        user_id
      `)
      .eq("is_approved", true)
      .eq("is_active", true);

    if (allProviders) {
      setProviders(allProviders);
    }
    setLoading(false);
  };

  const fetchAvailability = async (providerId) => {
    setLoading(true);
    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_active", true);
    if (data) setAvailability(data);
    setLoading(false);
  };

  const generateTimeSlots = async (date) => {
    if (!selectedProvider || !selectedService) return;

    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);

    // Check for blocked dates
    const { data: blockedDates } = await supabase
      .from("blocked_dates")
      .select("blocked_date")
      .eq("provider_id", selectedProvider.id)
      .eq("blocked_date", format(date, "yyyy-MM-dd"));

    if (blockedDates && blockedDates.length > 0) {
      setTimeSlots([]);
      return;
    }

    // Check existing appointments for this date
    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("start_time, end_time")
      .eq("provider_id", selectedProvider.id)
      .eq("appointment_date", format(date, "yyyy-MM-dd"))
      .neq("status", "cancelled")
      .neq("status", "rejected");

    const slots = [];
    const duration = selectedService.duration_minutes;

    dayAvailability.forEach(slot => {
      const [startHour, startMin] = slot.start_time.split(":").map(Number);
      const [endHour, endMin] = slot.end_time.split(":").map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
        
        // Check if slot is booked
        const isBooked = existingAppointments?.some(apt => {
          return apt.start_time <= timeStr && apt.end_time > timeStr;
        });

        slots.push({
          time: timeStr,
          available: !isBooked,
        });

        // Increment by 30 minutes
        currentMin += 30;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin = 0;
        }
      }
    });

    setTimeSlots(slots);
  };

  useEffect(() => {
    if (selectedDate && selectedProvider) {
      generateTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    fetchServices(category.id);
    setStep("service");
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    fetchProviders(service.id);
    setStep("provider");
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    fetchAvailability(provider.id);
    setStep("datetime");
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (date) {
      generateTimeSlots(date);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedService || !selectedProvider || !selectedDate || !selectedTime) return;

    setSubmitting(true);

    // Calculate end time
    const [hour, min] = selectedTime.split(":").map(Number);
    const endMinutes = hour * 60 + min + selectedService.duration_minutes;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;

    const { error } = await supabase.from("appointments").insert({
      customer_id: user.id,
      provider_id: selectedProvider.id,
      service_id: selectedService.id,
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: selectedTime,
      end_time: endTime,
      status: "pending",
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Booking confirmed!",
        description: "Your appointment request has been sent.",
      });
      navigate("/appointments");
    }
  };

  const goBack = () => {
    if (step === "service") {
      setStep("category");
      setSelectedCategory(null);
    } else if (step === "provider") {
      setStep("service");
      setSelectedService(null);
    } else if (step === "datetime") {
      setStep("provider");
      setSelectedProvider(null);
      setSelectedDate(undefined);
      setSelectedTime(null);
    } else if (step === "confirm") {
      setStep("datetime");
    }
  };

  const disabledDays = (date) => {
    // Disable past dates
    if (isBefore(date, startOfDay(new Date()))) return true;
    // Disable dates more than 30 days in advance
    if (isBefore(addDays(new Date(), 30), date)) return true;
    // Disable days without availability
    const dayOfWeek = date.getDay();
    return !availability.some(a => a.day_of_week === dayOfWeek);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Progress */}
        <div className="flex items-center gap-2 text-sm">
          <span className={step === "category" ? "text-primary font-medium" : "text-muted-foreground"}>Category</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === "service" ? "text-primary font-medium" : "text-muted-foreground"}>Service</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === "provider" ? "text-primary font-medium" : "text-muted-foreground"}>Provider</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === "datetime" ? "text-primary font-medium" : "text-muted-foreground"}>Date & Time</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === "confirm" ? "text-primary font-medium" : "text-muted-foreground"}>Confirm</span>
        </div>

        {step !== "category" && (
          <Button variant="ghost" onClick={goBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}

        {/* Category Selection */}
        {step === "category" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-display font-bold">Choose a Category</h1>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => {
                  const IconComp = iconMap[category.icon] || Briefcase;
                  return (
                    <Card 
                      key={category.id} 
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => handleCategorySelect(category)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <IconComp className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Service Selection */}
        {/* Service Selection */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : services.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No services available in this category
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <Card 
                    key={service.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {service.duration_minutes} min
                            </Badge>
                            {service.price && (
                              <span className="font-semibold">${service.price}</span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Provider Selection */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : providers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No providers available for this service
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <Card 
                    key={provider.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{provider.business_name}</h3>
                          <p className="text-sm text-muted-foreground">{provider.bio}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Date & Time Selection */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availability.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  This provider hasn't set their availability yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={disabledDays}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Times</CardTitle>
                    <CardDescription>
                      {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date first"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedDate ? (
                      <p className="text-muted-foreground text-center py-8">Please select a date</p>
                    ) : timeSlots.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No available slots on this date</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            variant={selectedTime === slot.time ? "default" : "outline"}
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className="text-sm"
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedDate && selectedTime && (
              <div className="flex justify-end">
                <Button onClick={() => setStep("confirm")} className="gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Confirmation */}
        {step === "confirm" && (
          <div className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Booking</CardTitle>
                <CardDescription>Review your appointment details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="font-medium">{selectedService?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">{selectedProvider?.business_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{selectedService?.duration_minutes} minutes</p>
                  </div>
                  {selectedService?.price && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Total Price</p>
                      <p className="text-2xl font-bold">${selectedService.price}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Confirm Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


