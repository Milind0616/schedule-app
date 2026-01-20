import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, CheckCircle, Star, Zap, Shield, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">ScheduleBook</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Simplify Your Scheduling
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Connect with service providers and book appointments effortlessly. 
            Save time, stay organized, and never miss an appointment again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Book an Appointment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Become a Provider
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ScheduleBook?</h2>
          <p className="text-lg text-muted-foreground">Everything you need to manage appointments efficiently</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardHeader>
              <Calendar className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Easy Booking</CardTitle>
              <CardDescription>
                Browse available time slots and book appointments in seconds with our intuitive interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-purple-500 transition-colors">
            <CardHeader>
              <Clock className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Real-Time Availability</CardTitle>
              <CardDescription>
                See provider availability instantly and get immediate confirmation for your bookings
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-green-500 transition-colors">
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Smart Reminders</CardTitle>
              <CardDescription>
                Never miss an appointment with automated notifications and reminders
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-orange-500 transition-colors">
            <CardHeader>
              <Users className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Multiple Services</CardTitle>
              <CardDescription>
                Access a wide range of service providers and services all in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-pink-500 transition-colors">
            <CardHeader>
              <Star className="h-12 w-12 text-pink-600 mb-4" />
              <CardTitle>Provider Management</CardTitle>
              <CardDescription>
                Comprehensive tools for providers to manage services, availability, and appointments
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-indigo-500 transition-colors">
            <CardHeader>
              <Shield className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade security and reliability
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-blue-50 dark:bg-gray-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Account</h3>
              <p className="text-muted-foreground">
                Sign up as a customer or provider in seconds with your email
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse & Select</h3>
              <p className="text-muted-foreground">
                Find the perfect service provider and choose your preferred time slot
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Book & Manage</h3>
              <p className="text-muted-foreground">
                Confirm your appointment and manage everything from your dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of users who trust ScheduleBook for their appointment needs
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Booking Now
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 ScheduleBook. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

