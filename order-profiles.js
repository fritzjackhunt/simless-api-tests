const https = require('follow-redirects').https;

function orderEsimProfile(transactionId, packageCode, price, count = 1) {
  const postData = JSON.stringify({
    transactionId: transactionId,
    amount: price * count,
    packageInfoList: [
      {
        packageCode: packageCode,
        count: count,
        price: price
      }
    ]
  });

  const options = {
    method: 'POST',
    hostname: 'api.esimaccess.com',
    path: '/api/v1/open/esim/order',
    headers: {
      'RT-AccessCode' : '810aefbd00554ab681baa2ef7bd396b4',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
      // Add Authorization header here if required by API
    },
    maxRedirects: 20
  };

  const req = https.request(options, (res) => {
    const chunks = [];

    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      console.log('Response from server:', body);
    });
  });

  req.on('error', (err) => {
    console.error('Error ordering eSIM:', err);
  });

  req.write(postData);
  req.end();
}

// Example usage:
orderEsimProfile('txn_12345', 'CKH256', 23000, 1);
