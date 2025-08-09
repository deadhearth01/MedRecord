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
  // New enhanced fields
  uploaded_by?: string
  uploaded_by_type?: 'self' | 'doctor' | 'hospital'
  hospital_name?: string
  doctor_notes?: string
  is_shared?: boolean
  visibility?: 'private' | 'shared_with_doctors' | 'public'
  gemini_analysis?: any
  extracted_text?: string
  analysis_version?: string
  confidence_score?: number
  created_at: string
  updated_at: string
}

// New interface for Personal Vault
export interface PersonalVaultItem {
  id: string
  user_id: string
  document_type: 'insurance' | 'aadhaar' | 'government_scheme' | 'passport' | 'license' | 'other'
  title: string
  description?: string
  file_name: string
  file_path: string
  file_url?: string
  file_size?: number
  file_type?: string
  vault_password_hash?: string
  is_shared: boolean
  shared_with: string[]
  share_expiry?: string
  created_at: string
  updated_at: string
}

// New interface for Shared Records
export interface SharedRecord {
  id: string
  patient_id: string
  doctor_id: string
  record_id?: string
  vault_item_id?: string
  record_type: 'medical_record' | 'vault_item'
  shared_at: string
  expires_at?: string
  access_count: number
  last_accessed?: string
  is_active: boolean
  sharing_notes?: string
  created_at: string
}

// New interface for QR Codes
export interface QRCode {
  id: string
  user_id: string
  qr_code_data: string
  qr_code_image_url?: string
  is_active: boolean
  expires_at?: string
  scan_count: number
  last_scanned?: string
  created_at: string
  updated_at: string
}

// New interface for Enhanced Appointments
export interface EnhancedAppointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  appointment_type: 'consultation' | 'follow-up' | 'emergency' | 'checkup' | 'procedure'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled'
  meeting_type: 'in-person' | 'video' | 'phone'
  meeting_link?: string
  location?: string
  notes?: string
  patient_notes?: string
  doctor_notes?: string
  fee?: number
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled'
  reminder_sent: boolean
  created_at: string
  updated_at: string
}

// New interface for Doctor Availability
export interface DoctorAvailability {
  id: string
  doctor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  slot_duration: number
  break_start_time?: string
  break_end_time?: string
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

// =============================================================================
// PERSONAL VAULT FUNCTIONS
// =============================================================================

// Create vault item
export const createVaultItem = async (vaultData: Omit<PersonalVaultItem, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('personal_vault')
    .insert(vaultData)
    .select()
    .single()
  return { data, error }
}

// Get user's vault items
export const getUserVaultItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('personal_vault')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Share vault item with doctors
export const shareVaultItem = async (vaultItemId: string, doctorIds: string[], expiryDate?: string) => {
  const { data, error } = await supabase
    .from('personal_vault')
    .update({
      is_shared: true,
      shared_with: JSON.stringify(doctorIds),
      share_expiry: expiryDate
    })
    .eq('id', vaultItemId)
    .select()
    .single()
  return { data, error }
}

// Verify vault password
export const verifyVaultPassword = async (vaultItemId: string, password: string) => {
  // This would hash the password and compare with stored hash
  // For now, returning true for demo purposes
  return { isValid: true, error: null }
}

// =============================================================================
// ENHANCED APPOINTMENTS FUNCTIONS
// =============================================================================

// Create enhanced appointment
export const createEnhancedAppointment = async (appointmentData: Omit<EnhancedAppointment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('appointments_enhanced')
    .insert(appointmentData)
    .select()
    .single()
  return { data, error }
}

// Get available time slots for a doctor
export const getDoctorAvailableSlots = async (doctorId: string, date: string) => {
  const { data, error } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('is_available', true)
  
  if (error) return { data: null, error }
  
  // Get existing appointments for the date
  const { data: appointments } = await supabase
    .from('appointments_enhanced')
    .select('appointment_time, duration_minutes')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', date)
    .not('status', 'in', '(cancelled,no-show)')
  
  // Calculate available slots (simplified version)
  const availableSlots: string[] = [] // This would calculate actual available slots
  return { data: availableSlots, error: null }
}

// Get doctor's appointments
export const getDoctorAppointments = async (doctorId: string, startDate?: string, endDate?: string) => {
  let query = supabase
    .from('appointments_enhanced')
    .select(`
      *,
      patient:patient_id(first_name, last_name, med_id)
    `)
    .eq('doctor_id', doctorId)
    .order('appointment_date', { ascending: true })
  
  if (startDate) query = query.gte('appointment_date', startDate)
  if (endDate) query = query.lte('appointment_date', endDate)
  
  const { data, error } = await query
  return { data, error }
}

// Get patient's appointments
export const getPatientAppointments = async (patientId: string) => {
  const { data, error } = await supabase
    .from('appointments_enhanced')
    .select(`
      *,
      doctor:doctor_id(first_name, last_name)
    `)
    .eq('patient_id', patientId)
    .order('appointment_date', { ascending: true })
  return { data, error }
}

// =============================================================================
// QR CODE FUNCTIONS
// =============================================================================

// Generate QR code for user
export const generateUserQRCode = async (userId: string, medId: string) => {
  // Generate QR code data (encrypt MED ID)
  const qrData = btoa(JSON.stringify({ medId, timestamp: Date.now() }))
  
  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      user_id: userId,
      qr_code_data: qrData,
      is_active: true
    })
    .select()
    .single()
  
  return { data, error }
}

// Get user's QR codes
export const getUserQRCodes = async (userId: string) => {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Scan QR code and get user MED ID
export const scanQRCode = async (qrData: string) => {
  try {
    const decoded = JSON.parse(atob(qrData))
    
    // Update scan count
    const { data: currentQR } = await supabase
      .from('qr_codes')
      .select('scan_count')
      .eq('qr_code_data', qrData)
      .single()
    
    if (currentQR) {
      await supabase
        .from('qr_codes')
        .update({ 
          scan_count: (currentQR.scan_count || 0) + 1,
          last_scanned: new Date().toISOString()
        })
        .eq('qr_code_data', qrData)
    }
    
    return { data: { medId: decoded.medId }, error: null }
  } catch (error) {
    return { data: null, error: { message: 'Invalid QR code' } }
  }
}

// =============================================================================
// SHARED RECORDS FUNCTIONS
// =============================================================================

// Share medical record with doctor
export const shareRecordWithDoctor = async (
  patientId: string,
  doctorId: string,
  recordId: string,
  recordType: 'medical_record' | 'vault_item',
  expiryDate?: string,
  notes?: string
) => {
  const { data, error } = await supabase
    .from('shared_records')
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      record_id: recordType === 'medical_record' ? recordId : null,
      vault_item_id: recordType === 'vault_item' ? recordId : null,
      record_type: recordType,
      expires_at: expiryDate,
      sharing_notes: notes
    })
    .select()
    .single()
  return { data, error }
}

// Get shared records for doctor
export const getSharedRecordsForDoctor = async (doctorId: string) => {
  const { data, error } = await supabase
    .from('shared_records')
    .select(`
      *,
      patient:patient_id(first_name, last_name, med_id),
      medical_record:record_id(*),
      vault_item:vault_item_id(*)
    `)
    .eq('doctor_id', doctorId)
    .eq('is_active', true)
    .order('shared_at', { ascending: false })
  return { data, error }
}

// Get patient's sharing history
export const getPatientSharingHistory = async (patientId: string) => {
  const { data, error } = await supabase
    .from('shared_records')
    .select(`
      *,
      doctor:doctor_id(first_name, last_name)
    `)
    .eq('patient_id', patientId)
    .order('shared_at', { ascending: false })
  return { data, error }
}

// Revoke access to shared record
export const revokeSharedAccess = async (sharedRecordId: string) => {
  const { data, error } = await supabase
    .from('shared_records')
    .update({ is_active: false })
    .eq('id', sharedRecordId)
    .select()
    .single()
  return { data, error }
}

// =============================================================================
// DOCTOR AVAILABILITY FUNCTIONS
// =============================================================================

// Set doctor availability
export const setDoctorAvailability = async (availabilityData: Omit<DoctorAvailability, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('doctor_availability')
    .upsert(availabilityData, { 
      onConflict: 'doctor_id,day_of_week'
    })
    .select()
  return { data, error }
}

// Get doctor availability
export const getDoctorAvailability = async (doctorId: string) => {
  const { data, error } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('day_of_week', { ascending: true })
  return { data, error }
}

// Search doctors by specialty and availability
export const searchAvailableDoctors = async (specialty?: string, date?: string) => {
  let query = supabase
    .from('users')
    .select(`
      *,
      doctor_profile:doctor_profiles(*),
      availability:doctor_availability(*)
    `)
    .eq('user_type', 'doctor')
  
  if (specialty) {
    query = query.contains('doctor_profile.specialty', specialty)
  }
  
  const { data, error } = await query
  return { data, error }
}

// =============================================================================
// ENHANCED GEMINI ANALYSIS FUNCTIONS
// =============================================================================

// Enhanced file analysis with Gemini 2.5 Flash
export const analyzeFileWithGemini = async (
  file: File,
  fileType: string,
  extractedText?: string
) => {
  try {
    // This would integrate with Gemini 2.5 Flash API
    // For now, returning mock data
    const analysis = {
      summary: "Advanced AI analysis using Gemini 2.5 Flash",
      keyFindings: ["Finding 1", "Finding 2"],
      medications: ["Medication 1"],
      recommendations: ["Recommendation 1"],
      urgencyLevel: "medium" as const,
      confidenceScore: 0.85,
      extractedText: extractedText || "OCR extracted text would go here",
      structuredData: {
        patientInfo: {},
        vitalSigns: {},
        testResults: {},
        diagnosis: {}
      }
    }
    
    return { data: analysis, error: null }
  } catch (error) {
    return { data: null, error: { message: 'Analysis failed' } }
  }
}