// Quick test to check user authentication and records
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jkwfnmddgrcpflhntczq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprd2ZubWRkZ3JjcGZsaG50Y3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MjcwMTMsImV4cCI6MjA2ODUwMzAxM30.z7vojt2NaMuKvLVcqQCBabIb7qZcg_v_VeGX33A7mgM'
);

async function debugUserSession() {
  try {
    // Check current auth session
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('Session error:', sessionError);
    
    if (session?.session?.user) {
      console.log('Session user ID:', session.session.user.id);
      console.log('Session user email:', session.session.user.email);
      
      // Check if this user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.session.user.id)
        .single();
        
      console.log('User profile:', profile);
      console.log('Profile error:', profileError);
      
      if (profile) {
        // Check records for this user
        const { data: records, error: recordsError } = await supabase
          .from('medical_records')
          .select('*')
          .eq('user_id', profile.id);
          
        console.log('Records for current user:', records);
        console.log('Records error:', recordsError);
      }
    } else {
      console.log('No active session found');
    }
    
  } catch (err) {
    console.error('Debug error:', err);
  }
}

debugUserSession();
