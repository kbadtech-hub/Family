const chapaSecretKey = 'CHASECK-0YpzjBjDeNQQ9fLam5V90XjGrnOKvFYN';

async function verifyTx() {
  try {
    const res = await fetch('https://api.chapa.co/v1/transaction/verify/DGK33MW3U3', {
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`
      }
    });
    const text = await res.text();
    console.log('Chapa Verify trans_id DGK33MW3U3:', text);

    const res2 = await fetch('https://api.chapa.co/v1/transaction/verify/APLc8aT770PM', {
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`
      }
    });
    const text2 = await res2.text();
    console.log('Chapa Verify ref_id APLc8aT770PM:', text2);
  } catch (err) {
    console.error('Error:', err);
  }
}

verifyTx();
