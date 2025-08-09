import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface User {
  id: string
  med_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  blood_group?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_conditions?: string
  medications?: string
  allergies?: string
  user_type: 'citizen' | 'doctor'
  created_at: string
  updated_at: string
}

export interface MedicalRecord {
  id: string
  user_id: string
  title: string
  category: 'prescription' | 'lab-report' | 'medical-bill' | 'scan-report' | 'consultation' | 'vaccination' | 'vital-signs' | 'other'
  description?: string
  summary?: string
  ai_analysis?: string
  key_findings?: string[]
  medications?: string[]
  recommendations?: string[]
  urgency_level?: 'low' | 'medium' | 'high'
  file_name?: string
  file_path?: string
  file_url?: string
  file_size?: number
  file_type?: string
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  user_id: string
  title: string
  appointment_date: string
  appointment_time: string
  doctor_name?: string
  location?: string
  notes?: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  appointment_type: 'in-person' | 'video' | 'phone'
  created_at: string
  updated_at: string
}

// Helper functions
export const generateMedId = (userType: 'citizen' | 'doctor'): string => {
  const prefix = userType === 'doctor' ? 'DR' : 'CT'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

// Auth functions
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    return { user: session.user, session }
  }
  return { user: null, session: null }
}

export const signInWithGoogle = async () => {
  // Get the current domain dynamically
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${currentOrigin}/auth/callback`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// User functions
export const createUserProfile = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single()
  
  return { data, error }
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

// Medical Records functions
export const createMedicalRecord = async (recordData: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('medical_records')
    .insert([recordData])
    .select()
    .single()
  
  return { data, error }
}

export const getMedicalRecords = async (userId: string) => {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const deleteMedicalRecord = async (recordId: string) => {
  const { error } = await supabase
    .from('medical_records')
    .delete()
    .eq('id', recordId)
  
  return { error }
}

export const updateMedicalRecord = async (recordId: string, updates: Partial<MedicalRecord>) => {
  const { data, error } = await supabase
    .from('medical_records')
    .update(updates)
    .eq('id', recordId)
    .select()
    .single()
  
  return { data, error }
}

// File upload functions
export const uploadFile = async (file: File, userId: string, fileName?: string) => {
  const fileExt = file.name.split('.').pop()
  const finalFileName = fileName || `${Math.random()}.${fileExt}`
  const filePath = `${userId}/${finalFileName}`

  const { data, error } = await supabase.storage
    .from('medical-files')
    .upload(filePath, file)

  return { data, error }
}

export const getFileUrl = async (filePath: string) => {
  const { data } = supabase.storage
    .from('medical-files')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export const downloadMedicalFile = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('medical-files')
    .download(filePath)
  
  return { data, error }
}

// Appointments functions
export const getAppointments = async (userId: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('appointment_date', { ascending: true })
  
  return { data, error }
}

export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select()
    .single()
  
  return { data, error }
}

// Dashboard functions
export const getDashboardStats = async (userId: string) => {
  try {
    // Get medical records count
    const { data: records, error: recordsError } = await supabase
      .from('medical_records')
      .select('category, urgency_level')
      .eq('user_id', userId)
    
    // Get appointments count
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('status, appointment_date')
      .eq('user_id', userId)
    
    if (recordsError || appointmentsError) {
      throw recordsError || appointmentsError
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    return {
      data: {
        totalRecords: records?.length || 0,
        totalAppointments: appointments?.length || 0,
        upcomingAppointments: appointments?.filter(apt => apt.appointment_date >= today && apt.status !== 'cancelled').length || 0,
        urgentRecords: records?.filter(record => record.urgency_level === 'high').length || 0,
        recordsByCategory: records?.reduce((acc: any, record) => {
          acc[record.category] = (acc[record.category] || 0) + 1
          return acc
        }, {}) || {}
      },
      error: null
    }
  } catch (error) {
    return { data: null, error }
  }
}

// Patient search functions (for doctors)
export const searchPatientsAdvanced = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_type', 'citizen')
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,med_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(20)
  
  return { data, error }
}

export const getPatientRecords = async (userId: string) => {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getPatientDetails = async (userId: string) => {
  try {
    // Get patient basic info
    const { data: patient, error: patientError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('user_type', 'citizen')
      .single()
    
    if (patientError) {
      return { data: null, error: patientError }
    }
    
    // Get medical records
    const { data: records, error: recordsError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Get appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: false })
      .limit(10)
    
    const stats = {
      totalRecords: records?.length || 0,
      totalAppointments: appointments?.length || 0,
      recordsByCategory: records?.reduce((acc: any, record) => {
        acc[record.category] = (acc[record.category] || 0) + 1
        return acc
      }, {}) || {}
    }
    
    return {
      data: {
        ...patient,
        stats,
        recentRecords: records || [],
        recentAppointments: appointments || []
      },
      error: null
    }
  } catch (error) {
    return { data: null, error }
  }
}

// Upload medical record function
export const uploadMedicalRecord = async (recordData: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'> & { file?: File }) => {
  console.log('=== UPLOAD MEDICAL RECORD START ===')
  
  // Validate user authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) {
    return { 
      data: null, 
      error: { 
        message: 'User not authenticated. Please sign in again.',
        code: 'AUTH_ERROR'
      } as any
    }
  }

  if (recordData.user_id !== session.user.id) {
    return { 
      data: null, 
      error: { 
        message: 'User ID does not match authenticated user.',
        code: 'USER_MISMATCH'
      } as any
    }
  }

  let filePath = ''
  let fileUrl = ''
  
  // Handle file upload if present
  if (recordData.file && recordData.file_name) {
    const timestamp = Date.now()
    const sanitizedFileName = recordData.file_name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`
    
    try {
      const { data: uploadData, error: uploadError } = await uploadFile(
        recordData.file, 
        recordData.user_id, 
        uniqueFileName
      )
      
      if (uploadData && uploadData.path) {
        filePath = uploadData.path
        fileUrl = await getFileUrl(uploadData.path)
      }
    } catch (uploadErr) {
      console.error('File upload error:', uploadErr)
    }
  }
  
  // Create database record
  const { file, ...dbRecordData } = recordData
  const finalRecordData = {
    user_id: dbRecordData.user_id,
    title: dbRecordData.title,
    category: dbRecordData.category,
    description: dbRecordData.description || undefined,
    summary: dbRecordData.summary || undefined,
    ai_analysis: dbRecordData.ai_analysis || undefined,
    key_findings: dbRecordData.key_findings || [],
    medications: dbRecordData.medications || [],
    recommendations: dbRecordData.recommendations || [],
    urgency_level: dbRecordData.urgency_level || 'low',
    file_name: dbRecordData.file_name || undefined,
    file_path: filePath || undefined,
    file_size: dbRecordData.file_size || undefined,
    file_type: dbRecordData.file_type || undefined
  }
  
  const result = await createMedicalRecord(finalRecordData)
  console.log('=== UPLOAD MEDICAL RECORD COMPLETE ===')
  return result
}

// Additional analysis function
export const analyzeExistingRecord = async (recordId: string) => {
  // This would trigger AI analysis for existing records
  // Implementation depends on your AI service setup
  return { data: null, error: { message: 'Analysis feature not implemented yet' } }
}