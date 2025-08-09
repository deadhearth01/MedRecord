-- Add missing file_url column to medical_records table
-- Run this in your Supabase SQL Editor

-- Check if file_url column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'file_url'
        AND table_schema = 'public'
    ) THEN
        -- Add the file_url column
        ALTER TABLE public.medical_records 
        ADD COLUMN file_url TEXT;
        
        RAISE NOTICE 'Added file_url column to medical_records table';
    ELSE
        RAISE NOTICE 'file_url column already exists in medical_records table';
    END IF;
END $$;

-- Also check and add other potentially missing columns
DO $$
BEGIN
    -- Check for ai_analysis column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'ai_analysis'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medical_records 
        ADD COLUMN ai_analysis TEXT;
        RAISE NOTICE 'Added ai_analysis column to medical_records table';
    END IF;
    
    -- Check for key_findings column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'key_findings'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medical_records 
        ADD COLUMN key_findings TEXT[];
        RAISE NOTICE 'Added key_findings column to medical_records table';
    END IF;
    
    -- Check for medications column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'medications'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medical_records 
        ADD COLUMN medications TEXT[];
        RAISE NOTICE 'Added medications column to medical_records table';
    END IF;
    
    -- Check for recommendations column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'recommendations'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medical_records 
        ADD COLUMN recommendations TEXT[];
        RAISE NOTICE 'Added recommendations column to medical_records table';
    END IF;
    
    -- Check for urgency_level column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'urgency_level'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medical_records 
        ADD COLUMN urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high'));
        RAISE NOTICE 'Added urgency_level column to medical_records table';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;
