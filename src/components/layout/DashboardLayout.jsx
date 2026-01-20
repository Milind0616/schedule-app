import { ReactNode } from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger,
  useSidebar 
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Clock, 
  Briefcase,
  BarChart3,
  Menu,
  ChevronDown
} from "lucide-react";
import { Loader2 } from "lucide-react";



const customerNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Book Appointment", url: "/book", icon: Calendar },
  { title: "My Appointments", url: "/appointments", icon: Clock },
];

const providerNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Appointments", url: "/provider/appointments", icon: Calendar },
  { title: "Availability", url: "/provider/availability", icon: Clock },
  { title: "Services", url: "/provider/services", icon: Briefcase },
];

const adminNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Services", url: "/admin/services", icon: Briefcase },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

function AppSidebar() {
  const { role } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const navItems = role === "admin" ? adminNav : role === "provider" ? providerNav : customerNav;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <div className="p-4 flex items-center gap-2">
        <Calendar className="h-6 w-6 text-sidebar-primary shrink-0" />
        {!collapsed && <span className="font-display font-bold text-lg">BookFlow</span>}
      </div>
      
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function DashboardHeader() {
  const { user, role, signOut } = useAuth();

  const getInitials = (email) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleBadge = () => {
    const colors = {
      admin: "bg-destructive/10 text-destructive",
      provider: "bg-primary/10 text-primary",
      customer: "bg-success/10 text-success",
    };
    return colors[role || "customer"];
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        <SidebarTrigger>
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user?.email || "")}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm">{user?.email}</span>
              <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full capitalize ${getRoleBadge()}`}>
                {role}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

