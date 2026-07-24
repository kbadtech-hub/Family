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
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function runMigration() {
  console.log('Applying gift migration SQL...\n');

  const sqls = [
    // Add missing columns to gifts
    `ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS is_converted BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS conversion_fee NUMERIC DEFAULT 0`,
    `ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS net_coins_received NUMERIC DEFAULT 0`,

    // coin_transactions: insert policy
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'coin_transactions' 
        AND policyname = 'Users can insert own coin transactions'
      ) THEN
        EXECUTE 'CREATE POLICY "Users can insert own coin transactions" ON public.coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id)';
      END IF;
    END $$`,

    // gifts: update policy for conversion  
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gifts' 
        AND policyname = 'Users can update received gifts'
      ) THEN
        EXECUTE 'CREATE POLICY "Users can update received gifts" ON public.gifts FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id)';
      END IF;
    END $$`,

    // gifts: add status column if missing
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='gifts' AND column_name='status'
      ) THEN
        ALTER TABLE public.gifts ADD COLUMN status TEXT DEFAULT 'pending';
      ELSE
        ALTER TABLE public.gifts DROP CONSTRAINT IF EXISTS gifts_status_check;
        ALTER TABLE public.gifts ADD CONSTRAINT gifts_status_check CHECK (status IN ('pending', 'completed', 'converted'));
      END IF;
    END $$`
  ];

  for (const sql of sqls) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql }).then
        ? await supabase.rpc('exec_sql', { sql })
        : { error: { message: 'no rpc' } };
      if (error) throw error;
      console.log('✅ OK');
    } catch (e) {
      // Try raw via auth.admin.query or just log
      console.log('  ⚠️  Could not apply via RPC (expected):', sql.substring(0, 60), '...');
    }
  }

  // Verify columns added via direct query
  const { data, error } = await supabase.from('gifts').select('id, is_converted, conversion_fee, net_coins_received').limit(1);
  if (error) {
    console.log('\n⚠️  Columns might not be applied yet. Error:', error.message);
    console.log('   Please run this SQL manually in your Supabase SQL Editor:\n');
  } else {
    console.log('\n✅ Gift conversion columns are present! Columns verified.');
  }

  console.log(`\n📋 SQL to paste in Supabase SQL Editor if needed:
  
ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS is_converted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS conversion_fee NUMERIC DEFAULT 0;
ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS net_coins_received NUMERIC DEFAULT 0;

-- Fix status check constraint to allow 'converted':
ALTER TABLE public.gifts DROP CONSTRAINT IF EXISTS gifts_status_check;
ALTER TABLE public.gifts ADD CONSTRAINT gifts_status_check CHECK (status IN ('pending', 'completed', 'converted'));

-- Add insert policy for coin_transactions (if not exists):
CREATE POLICY IF NOT EXISTS "Users can insert own coin transactions"
  ON public.coin_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add update policy for gifts:
CREATE POLICY IF NOT EXISTS "Users can update received gifts"
  ON public.gifts FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
`);
}

runMigration();
