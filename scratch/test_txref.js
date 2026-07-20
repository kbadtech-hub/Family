const chapaSecretKey = 'CHASECK-0YpzjBjDeNQQ9fLam5V90XjGrnOKvFYN';

async function testTxRefVerify() {
  const tx_ref = '317dc156-7331-32f4-aec3-ba636e2f2d4f-c100-tp89px';
  const res = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
    headers: {
      Authorization: `Bearer ${chapaSecretKey}`
    }
  });
  const text = await res.text();
  console.log('Chapa Verify tx_ref:', text);
}

testTxRefVerify();
