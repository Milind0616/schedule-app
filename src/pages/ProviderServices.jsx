import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Check, Clock, Loader2 } from "lucide-react";

export default function ProviderServices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState(null);
  const [services, setServices] = useState([]);
  const [providerServices, setProviderServices] = useState([]);

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
      fetchServices();
      fetchProviderServices(provider.id);
    } else {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select(`
        id,
        name,
        description,
        duration_minutes,
        price,
        category:service_categories (name)
      `)
      .eq("is_active", true);

    if (data) setServices(data);
    setLoading(false);
  };

  const fetchProviderServices = async (provId) => {
    const { data } = await supabase
      .from("provider_services")
      .select("id, service_id")
      .eq("provider_id", provId);

    if (data) setProviderServices(data);
  };

  const isServiceEnabled = (serviceId) => {
    return providerServices.some(ps => ps.service_id === serviceId);
  };

  const toggleService = async (serviceId) => {
    if (!providerId) return;

    const existing = providerServices.find(ps => ps.service_id === serviceId);

    if (existing) {
      // Remove
      const { error } = await supabase
        .from("provider_services")
        .delete()
        .eq("id", existing.id);

      if (!error) {
        setProviderServices(providerServices.filter(ps => ps.id !== existing.id));
        toast({ title: "Removed", description: "Service removed from your offerings" });
      }
    } else {
      // Add
      const { data, error } = await supabase
        .from("provider_services")
        .insert({
          provider_id: providerId,
          service_id: serviceId,
        })
        .select()
        .single();

      if (data) {
        setProviderServices([...providerServices, { id: data.id, service_id: data.service_id }]);
        toast({ title: "Added", description: "Service added to your offerings" });
      }
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category?.name || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

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
          <h1 className="text-3xl font-display font-bold">My Services</h1>
          <p className="text-muted-foreground mt-1">Choose which services you offer</p>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Briefcase className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Enable the services you provide</p>
            <p className="text-sm text-muted-foreground">
              Customers will be able to book appointments for these services with you.
            </p>
          </div>
        </div>

        {Object.entries(groupedServices).map(([category, categoryServices]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryServices.map((service) => (
                <div 
                  key={service.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    isServiceEnabled(service.id) ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={isServiceEnabled(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes} min
                        </Badge>
                        {service.price && (
                          <Badge variant="outline" className="gap-1">
                            <span>${service.price}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {isServiceEnabled(service.id) && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {services.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No services available. Please contact admin to add services.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

