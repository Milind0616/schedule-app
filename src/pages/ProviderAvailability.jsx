import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";





const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${min}`;
});

export default function ProviderAvailability() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providerId, setProviderId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [newBlockedDate, setNewBlockedDate] = useState();
  const [blockReason, setBlockReason] = useState("");

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
      fetchAvailability(provider.id);
      fetchBlockedDates(provider.id);
    } else {
      setLoading(false);
    }
  };

  const fetchAvailability = async (provId) => {
    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("provider_id", provId)
      .order("day_of_week");

    if (data) setSlots(data);
    setLoading(false);
  };

  const fetchBlockedDates = async (provId) => {
    const { data } = await supabase
      .from("blocked_dates")
      .select("*")
      .eq("provider_id", provId)
      .order("blocked_date");

    if (data) setBlockedDates(data);
  };

  const addSlot = async (dayOfWeek) => {
    if (!providerId) return;

    const { data, error } = await supabase
      .from("availability_slots")
      .insert({
        provider_id: providerId,
        day_of_week: dayOfWeek,
        start_time: "09:00",
        end_time: "17:00",
        is_active: true,
      })
      .select()
      .single();

    if (data) {
      setSlots([...slots, data]);
      toast({ title: "Added", description: "Availability slot added" });
    }
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateSlot = async (id, updates) => {
    const { error } = await supabase
      .from("availability_slots")
      .update(updates)
      .eq("id", id);

    if (!error) {
      setSlots(slots.map(s => s.id === id ? { ...s, ...updates } : s));
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteSlot = async (id) => {
    const { error } = await supabase
      .from("availability_slots")
      .delete()
      .eq("id", id);

    if (!error) {
      setSlots(slots.filter(s => s.id !== id));
      toast({ title: "Deleted", description: "Slot removed" });
    }
  };

  const addBlockedDate = async () => {
    if (!providerId || !newBlockedDate) return;

    const { data, error } = await supabase
      .from("blocked_dates")
      .insert({
        provider_id: providerId,
        blocked_date: format(newBlockedDate, "yyyy-MM-dd"),
        reason: blockReason || null,
      })
      .select()
      .single();

    if (data) {
      setBlockedDates([...blockedDates, data]);
      setNewBlockedDate(undefined);
      setBlockReason("");
      toast({ title: "Added", description: "Date blocked" });
    }
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Error", description: "This date is already blocked", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
  };

  const deleteBlockedDate = async (id) => {
    const { error } = await supabase
      .from("blocked_dates")
      .delete()
      .eq("id", id);

    if (!error) {
      setBlockedDates(blockedDates.filter(d => d.id !== id));
      toast({ title: "Removed", description: "Date unblocked" });
    }
  };

  const getSlotsByDay = (day) => slots.filter(s => s.day_of_week === day);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Availability</h1>
          <p className="text-muted-foreground mt-1">Set your working hours and block time off</p>
        </div>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Set your available hours for each day of the week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {DAYS.map((day, index) => {
              const daySlots = getSlotsByDay(index);
              return (
                <div key={day} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{day}</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addSlot(index)}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Slot
                    </Button>
                  </div>

                  {daySlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No availability set</p>
                  ) : (
                    <div className="space-y-2">
                      {daySlots.map((slot) => (
                        <div key={slot.id} className="flex items-center gap-4 bg-muted/50 p-3 rounded-lg">
                          <Switch
                            checked={slot.is_active}
                            onCheckedChange={(checked) => updateSlot(slot.id, { is_active: checked })}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <Select
                              value={slot.start_time.slice(0, 5)}
                              onValueChange={(v) => updateSlot(slot.id, { start_time: v })}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map(t => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">to</span>
                            <Select
                              value={slot.end_time.slice(0, 5)}
                              onValueChange={(v) => updateSlot(slot.id, { end_time: v })}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map(t => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSlot(slot.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Blocked Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Blocked Dates</CardTitle>
            <CardDescription>Block specific dates when you're unavailable</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-48 justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {newBlockedDate ? format(newBlockedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newBlockedDate}
                      onSelect={setNewBlockedDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 flex-1">
                <Label>Reason (optional)</Label>
                <Input
                  placeholder="e.g., Holiday, Personal day"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
              <Button onClick={addBlockedDate} disabled={!newBlockedDate}>
                Block Date
              </Button>
            </div>

            {blockedDates.length > 0 && (
              <div className="space-y-2 mt-4">
                {blockedDates.map((blocked) => (
                  <div key={blocked.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{format(new Date(blocked.blocked_date), "PPP")}</p>
                      {blocked.reason && <p className="text-sm text-muted-foreground">{blocked.reason}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBlockedDate(blocked.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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


