const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey);

async function testTables() {
  const { data: sData, error: sErr } = await supabase.from('settings').select('*').limit(1);
  console.log('--- settings table ---');
  console.log('Data:', sData);
  console.log('Error:', sErr ? sErr.message : 'none');

  const { data: uData, error: uErr } = await supabase.from('user_wallets').select('*').limit(1);
  console.log('--- user_wallets table ---');
  console.log('Data:', uData);
  console.log('Error:', uErr ? uErr.message : 'none');

  const { data: pData, error: pErr } = await supabase.from('profiles').select('id, full_name, onboarding_completed, verification_status').limit(2);
  console.log('--- profiles table ---');
  console.log('Data count:', pData ? pData.length : 0);
  console.log('Error:', pErr ? pErr.message : 'none');
}

testTables();
