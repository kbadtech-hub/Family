async function trigger() {
  try {
    console.log('Sending sync request to local Next.js server...');
    const res = await fetch('http://localhost:3000/api/admin/payments/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'sync_chapa_transactions'
      })
    });
    const status = res.status;
    const text = await res.text();
    console.log('Response Status:', status);
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Error triggering sync:', err);
  }
}

// Wait 3 seconds for server to be fully ready before sending
setTimeout(trigger, 3000);
