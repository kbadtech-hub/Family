const chapaSecretKey = 'CHASECK-0YpzjBjDeNQQ9fLam5V90XjGrnOKvFYN';

async function checkChapaTx() {
  try {
    const res = await fetch('https://api.chapa.co/v1/transactions', {
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`
      }
    });
    const text = await res.text();
    console.log('Chapa Transactions response:', text);
  } catch (err) {
    console.error('Error fetching Chapa transactions:', err);
  }
}

checkChapaTx();
