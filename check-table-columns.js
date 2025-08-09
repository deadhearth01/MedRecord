// Check what columns actually exist in medical_records table
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableColumns() {
  console.log('🔍 Checking medical_records table columns...');
  
  try {
    // Query the information_schema to see what columns exist
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'medical_records' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (error) {
      console.error('❌ Error querying table structure:', error);
      
      // Alternative: Try to get columns by doing a select with limit 0
      console.log('\n🔄 Trying alternative method...');
      const { data: selectData, error: selectError } = await supabase
        .from('medical_records')
        .select('*')
        .limit(0);
        
      if (selectError) {
        console.error('❌ Alternative method also failed:', selectError);
      } else {
        console.log('✅ Table is accessible but columns info not available via RPC');
      }
    } else {
      console.log('✅ Table structure:');
      console.table(data);
      
      // Check for specific columns we need
      const requiredColumns = [
        'file_url', 'ai_analysis', 'key_findings', 
        'medications', 'recommendations', 'urgency_level'
      ];
      
      const existingColumns = data.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\n❌ Missing columns:', missingColumns);
        console.log('\n📝 You need to run the fix-missing-columns.sql script in Supabase SQL Editor');
      } else {
        console.log('\n✅ All required columns are present');
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTableColumns();
