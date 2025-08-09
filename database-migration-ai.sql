-- =============================================================================
-- AI ANALYSIS ENHANCEMENT - DATABASE MIGRATION
-- =============================================================================
-- Run these commands in your Supabase SQL Editor to add AI analysis features

-- Add AI analysis columns to medical_records table
ALTER TABLE public.medical_records 
ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
ADD COLUMN IF NOT EXISTS key_findings TEXT[],
ADD COLUMN IF NOT EXISTS medications TEXT[],
ADD COLUMN IF NOT EXISTS recommendations TEXT[],
ADD COLUMN IF NOT EXISTS urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high'));

-- Update existing records to have default urgency_level if NULL
UPDATE public.medical_records 
SET urgency_level = 'low' 
WHERE urgency_level IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.medical_records.ai_analysis IS 'Full AI analysis data stored as JSON string';
COMMENT ON COLUMN public.medical_records.key_findings IS 'Array of key medical findings extracted by AI';
COMMENT ON COLUMN public.medical_records.medications IS 'Array of medications mentioned in the document';
COMMENT ON COLUMN public.medical_records.recommendations IS 'Array of medical recommendations from AI analysis';
COMMENT ON COLUMN public.medical_records.urgency_level IS 'Urgency level determined by AI analysis (low/medium/high)';

-- =============================================================================
-- VERIFY CHANGES
-- =============================================================================
-- Run this to verify the columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;
