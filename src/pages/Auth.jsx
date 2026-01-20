import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState("customer");
  const [businessName, setBusinessName] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(loginEmail);
    if (!emailResult.success) {
      toast({ title: "Error", description: emailResult.error.errors[0].message, variant: "destructive" });
      return;
    }
    
    const passwordResult = passwordSchema.safeParse(loginPassword);
    if (!passwordResult.success) {
      toast({ title: "Error", description: passwordResult.error.errors[0].message, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(signupEmail);
    if (!emailResult.success) {
      toast({ title: "Error", description: emailResult.error.errors[0].message, variant: "destructive" });
      return;
    }
    
    const passwordResult = passwordSchema.safeParse(signupPassword);
    if (!passwordResult.success) {
      toast({ title: "Error", description: passwordResult.error.errors[0].message, variant: "destructive" });
      return;
    }

    if (!signupName.trim()) {
      toast({ title: "Error", description: "Please enter your full name", variant: "destructive" });
      return;
    }

    if (signupRole === "provider" && !businessName.trim()) {
      toast({ title: "Error", description: "Please enter your business name", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(
      signupEmail, 
      signupPassword, 
      signupName, 
      signupRole,
      signupRole === "provider" ? businessName : undefined
    );
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast({ title: "Account exists", description: "This email is already registered. Please sign in instead.", variant: "destructive" });
      } else {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Success", description: "Account created successfully! Please sign in." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">BookFlow</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-display">Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>I want to</Label>
                    <RadioGroup value={signupRole} onValueChange={(v) => setSignupRole(v)}>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="customer" id="customer" />
                        <Label htmlFor="customer" className="cursor-pointer flex-1">
                          <span className="font-medium">Book Services</span>
                          <p className="text-sm text-muted-foreground">Find and book appointments with service providers</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="provider" id="provider" />
                        <Label htmlFor="provider" className="cursor-pointer flex-1">
                          <span className="font-medium">Offer Services</span>
                          <p className="text-sm text-muted-foreground">Manage bookings and grow your business</p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {signupRole === "provider" && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="business-name">Business Name</Label>
                      <Input
                        id="business-name"
                        type="text"
                        placeholder="Your Business Name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

