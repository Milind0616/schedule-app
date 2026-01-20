import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2 } from "lucide-react";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export default function AdminAnalytics() {
  const { role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => { if (role === "admin") fetchAnalytics(); }, [role]);

  const fetchAnalytics = async () => {
    const { data: appointments } = await supabase.from("appointments").select("status");
    if (appointments) {
      const counts = appointments.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
      setStatusData(Object.entries(counts).map(([name, value]) => ({ name, value })));
    }

    const { data: services } = await supabase.from("services").select("category:service_categories(name)");
    if (services) {
      const counts = services.reduce((acc, s) => { const name = s.category?.name || "Other"; acc[name] = (acc[name] || 0) + 1; return acc; }, {});
      setCategoryData(Object.entries(counts).map(([name, count]) => ({ name, count })));
    }
    setLoading(false);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Analytics</h1>

        {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Appointments by Status</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Services by Category</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


