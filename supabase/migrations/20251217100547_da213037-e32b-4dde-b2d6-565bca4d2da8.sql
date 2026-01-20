-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'provider', 'customer');

-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create service categories table
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create providers table (extended profile for service providers)
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT,
  bio TEXT,
  is_approved BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create provider_services junction table
CREATE TABLE public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  custom_price DECIMAL(10,2),
  custom_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (provider_id, service_id)
);

-- Create availability_slots table
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create blocked_dates table (for provider time off)
CREATE TABLE public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (provider_id, blocked_date)
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status appointment_status DEFAULT 'pending' NOT NULL,
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Get role from metadata or default to customer
  user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'customer');
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- If provider, create provider record
  IF user_role = 'provider' THEN
    INSERT INTO public.providers (user_id, business_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'business_name');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON public.availability_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for service_categories (public read, admin write)
CREATE POLICY "Anyone can view categories" ON public.service_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.service_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for services (public read, admin write)
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can view all services" ON public.services FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for providers
CREATE POLICY "Anyone can view approved providers" ON public.providers FOR SELECT TO authenticated USING (is_approved = true AND is_active = true);
CREATE POLICY "Providers can view their own profile" ON public.providers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Providers can update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all providers" ON public.providers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage providers" ON public.providers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for provider_services
CREATE POLICY "Anyone can view provider services" ON public.provider_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Providers can manage their own services" ON public.provider_services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage provider services" ON public.provider_services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for availability_slots
CREATE POLICY "Anyone can view active availability" ON public.availability_slots FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Providers can manage their own availability" ON public.availability_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage availability" ON public.availability_slots FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for blocked_dates
CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Providers can manage their own blocked dates" ON public.blocked_dates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage blocked dates" ON public.blocked_dates FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for appointments
CREATE POLICY "Customers can view their own appointments" ON public.appointments FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update their own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Providers can view appointments for them" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);
CREATE POLICY "Providers can update appointments for them" ON public.appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert some default service categories
INSERT INTO public.service_categories (name, description, icon) VALUES
  ('Healthcare', 'Medical and health services', 'stethoscope'),
  ('Beauty & Wellness', 'Salon, spa, and wellness services', 'sparkles'),
  ('Education', 'Tutoring and educational services', 'graduation-cap'),
  ('Professional Services', 'Legal, financial, and consulting', 'briefcase'),
  ('Home Services', 'Repair, cleaning, and maintenance', 'home');

-- Insert some default services
INSERT INTO public.services (category_id, name, description, duration_minutes, price) VALUES
  ((SELECT id FROM public.service_categories WHERE name = 'Healthcare'), 'General Consultation', 'General health checkup and consultation', 30, 75.00),
  ((SELECT id FROM public.service_categories WHERE name = 'Healthcare'), 'Specialist Consultation', 'Consultation with a specialist doctor', 45, 150.00),
  ((SELECT id FROM public.service_categories WHERE name = 'Beauty & Wellness'), 'Haircut', 'Professional haircut and styling', 45, 35.00),
  ((SELECT id FROM public.service_categories WHERE name = 'Beauty & Wellness'), 'Massage Therapy', 'Full body relaxation massage', 60, 80.00),
  ((SELECT id FROM public.service_categories WHERE name = 'Education'), 'Math Tutoring', 'One-on-one math tutoring session', 60, 50.00),
  ((SELECT id FROM public.service_categories WHERE name = 'Education'), 'Language Lesson', 'Private language learning session', 60, 45.00),
  ((SELECT id FROM public.service_categories WHERE name = 'Professional Services'), 'Legal Consultation', 'Initial legal advice session', 60, 200.00),
  ((SELECT id FROM public.service_categories WHERE name = 'Home Services'), 'Plumbing Service', 'General plumbing repair and maintenance', 60, 85.00);