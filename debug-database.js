const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jkwfnmddgrcpflhntczq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprd2ZubWRkZ3JjcGZsaG50Y3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MjcwMTMsImV4cCI6MjA2ODUwMzAxM30.z7vojt2NaMuKvLVcqQCBabIb7qZcg_v_VeGX33A7mgM');

(async () => {
  console.log('=== Detailed Database Check ===');
  
  // Check users with detailed info
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');
  
  console.log('\n--- USERS ---');
  if (users) {
    users.forEach((u, i) => {
      console.log(`${i+1}. ID: ${u.id}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   MED ID: ${u.med_id}`);
      console.log(`   Type: ${u.user_type}`);
      console.log(`   Name: ${u.full_name || 'Not set'}`);
      console.log('');
    });
  }
  
  // Check medical records with detailed info
  const { data: records, error: recordsError } = await supabase
    .from('medical_records')
    .select('*');
    
  console.log('--- MEDICAL RECORDS ---');
  if (records && records.length > 0) {
    records.forEach((r, i) => {
      console.log(`${i+1}. ID: ${r.id}`);
      console.log(`   User ID: ${r.user_id}`);
      console.log(`   Title: ${r.title}`);
      console.log(`   Category: ${r.category}`);
      console.log(`   File: ${r.file_name || 'No file'}`);
      console.log(`   File Path: ${r.file_path || 'No path'}`);
      console.log(`   Created: ${r.created_at}`);
      console.log('');
    });
  } else {
    console.log('No medical records found');
  }
  
  // Check storage files in user folders
  try {
    console.log('--- STORAGE FILES ---');
    
    if (users) {
      for (const user of users) {
        console.log(`\nChecking files for user: ${user.email} (${user.id})`);
        try {
          const { data: userFiles, error: userFilesError } = await supabase.storage
            .from('medical-files')
            .list(user.id, { limit: 100 });
            
          if (userFiles && userFiles.length > 0) {
            userFiles.forEach(f => {
              console.log(`  - ${f.name} (${f.metadata?.size || 'unknown size'} bytes)`);
            });
          } else {
            console.log('  No files found');
          }
        } catch (err) {
          console.log(`  Error accessing folder: ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.log('Storage access error:', err.message);
  }
})();
