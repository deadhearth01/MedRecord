-- =============================================================================
-- MEDRECORD ADVANCED FEATURES DATABASE MIGRATION
-- =============================================================================
-- This script adds all the new advanced features to the MedRecord application

-- 1. Create Personal Vault table for secure document storage
CREATE TABLE IF NOT EXISTS public.personal_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('insurance', 'aadhaar', 'government_scheme', 'passport', 'license', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  vault_password_hash TEXT, -- Additional password protection for vault access
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with JSONB DEFAULT '[]', -- JSON array of user IDs with access
  share_expiry TIMESTAMP WITH TIME ZONE, -- Expiration date for sharing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Shared Records table for controlled record sharing
CREATE TABLE IF NOT EXISTS public.shared_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
  vault_item_id UUID REFERENCES public.personal_vault(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('medical_record', 'vault_item')),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  sharing_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create QR Codes table for MED ID sharing
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  qr_code_data TEXT NOT NULL, -- Encrypted MED ID data
  qr_code_image_url TEXT, -- URL to QR code image
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  scan_count INTEGER DEFAULT 0,
  last_scanned TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Enhanced Appointments table (for Cal.com like booking)
CREATE TABLE IF NOT EXISTS public.appointments_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  appointment_type TEXT DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow-up', 'emergency', 'checkup', 'procedure')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled')),
  meeting_type TEXT DEFAULT 'in-person' CHECK (meeting_type IN ('in-person', 'video', 'phone')),
  meeting_link TEXT, -- For video appointments
  location TEXT, -- For in-person appointments
  notes TEXT,
  patient_notes TEXT, -- Notes from patient
  doctor_notes TEXT, -- Notes from doctor
  fee DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Doctor Availability table for booking system
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  slot_duration INTEGER DEFAULT 30, -- Duration in minutes
  break_start_time TIME,
  break_end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add new columns to existing medical_records table for enhanced features
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.users(id);
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS uploaded_by_type TEXT CHECK (uploaded_by_type IN ('self', 'doctor', 'hospital'));
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS hospital_name TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS doctor_notes TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'shared_with_doctors', 'public'));

-- 7. Add enhanced AI analysis columns
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS gemini_analysis JSONB; -- Store full Gemini 2.5 Flash analysis
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS extracted_text TEXT; -- OCR extracted text
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS analysis_version TEXT DEFAULT 'gemini-2.5-flash';
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2); -- Analysis confidence (0.00-1.00)

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Personal Vault policies
ALTER TABLE public.personal_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own vault" ON public.personal_vault FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors can view shared vault items" ON public.personal_vault FOR SELECT USING (
  shared_with ? auth.uid()::text AND is_shared = TRUE AND (share_expiry IS NULL OR share_expiry > NOW())
);

-- Shared Records policies
ALTER TABLE public.shared_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can manage their sharing" ON public.shared_records FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view shared records" ON public.shared_records FOR SELECT USING (auth.uid() = doctor_id AND is_active = TRUE);

-- QR Codes policies
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own QR codes" ON public.qr_codes FOR ALL USING (auth.uid() = user_id);

-- Enhanced Appointments policies
ALTER TABLE public.appointments_enhanced ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can manage own appointments" ON public.appointments_enhanced FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can manage their appointments" ON public.appointments_enhanced FOR ALL USING (auth.uid() = doctor_id);

-- Doctor Availability policies
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can manage own availability" ON public.doctor_availability FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "Anyone can view doctor availability" ON public.doctor_availability FOR SELECT USING (TRUE);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Personal Vault indexes
CREATE INDEX IF NOT EXISTS idx_personal_vault_user_id ON public.personal_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_vault_shared ON public.personal_vault(is_shared) WHERE is_shared = TRUE;

-- Shared Records indexes
CREATE INDEX IF NOT EXISTS idx_shared_records_patient ON public.shared_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_shared_records_doctor ON public.shared_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_shared_records_active ON public.shared_records(is_active) WHERE is_active = TRUE;

-- QR Codes indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON public.qr_codes(is_active) WHERE is_active = TRUE;

-- Enhanced Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_enhanced_patient ON public.appointments_enhanced(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_enhanced_doctor ON public.appointments_enhanced(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_enhanced_date ON public.appointments_enhanced(appointment_date);

-- Doctor Availability indexes
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON public.doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON public.doctor_availability(day_of_week);

-- Medical Records enhanced indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_uploaded_by ON public.medical_records(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_medical_records_shared ON public.medical_records(is_shared) WHERE is_shared = TRUE;
