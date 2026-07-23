const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local
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

async function applyMigration() {
  console.log('Testing/Applying Reward System Schema...');

  // 1. Ensure reward_system_settings table exists
  const { data: settingsData, error: settingsError } = await supabase
    .from('reward_system_settings')
    .select('*')
    .eq('id', 'global');

  if (settingsError && settingsError.code === '42P01') {
    console.log('reward_system_settings table does not exist in REST yet.');
  } else if (!settingsData || settingsData.length === 0) {
    console.log('Seeding global settings row...');
    const { data: inserted, error: insertErr } = await supabase
      .from('reward_system_settings')
      .insert({
        id: 'global',
        total_budget: 10000,
        distributed_coins: 0,
        remaining_coins: 10000,
        is_active: true,
        google_play_url: 'https://play.google.com/store/apps/details?id=com.beteseb.app',
        apple_store_url: 'https://apps.apple.com/app/beteseb/id123456789'
      });
    if (insertErr) console.error('Insert Error:', insertErr.message);
    else console.log('✅ Global settings row seeded successfully.');
  } else {
    console.log('✅ Global settings already present:', settingsData[0]);
  }

  // 2. Check user_reward_tiers table
  const { error: tierErr } = await supabase.from('user_reward_tiers').select('id').limit(1);
  if (tierErr && tierErr.code === '42P01') {
    console.log('user_reward_tiers table needs DDL application.');
  } else {
    console.log('✅ user_reward_tiers table accessible via REST API.');
  }
}

applyMigration();
