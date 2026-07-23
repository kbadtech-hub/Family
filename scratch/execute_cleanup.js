const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mpreyyjclfklvofzfosc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcmV5eWpjbGZrbHZvZnpmb3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzExNzYyMywiZXhwIjoyMDkyNjkzNjIzfQ.uplICXpCoqzPZZb55yKhoWa-srZhNOyhqzBfI_SSEMk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const updates = [
    {
      id: 'dd20d02d-595b-4cfa-8021-63da2665c73f',
      new_url: 'Chapa TX: 317dc156-7331-32f4-aec3-ba636e2f2d4f-v1m-w0e0le'
    },
    {
      id: 'ecadf44e-1b66-441e-9ec4-cf193e623bc9',
      new_url: 'Chapa TX: 317dc156-7331-32f4-aec3-ba636e2f2d4f-1m-vx05q1'
    },
    {
      id: '0f4c1a55-307a-4a46-9f23-5e9421fe4678',
      new_url: 'Chapa TX: 317dc156-7331-32f4-aec3-ba636e2f2d4f-c100-tp89px'
    }
  ];

  for (const update of updates) {
    console.log(`Updating payment ID ${update.id} receipt_url to: ${update.new_url}`);
    const { data, error } = await supabase
      .from('payments')
      .update({ receipt_url: update.new_url })
      .eq('id', update.id)
      .select();

    if (error) {
      console.error(`Error updating ID ${update.id}:`, error);
    } else {
      console.log(`Successfully updated ID ${update.id}:`, JSON.stringify(data, null, 2));
    }
  }
}

run();
