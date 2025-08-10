const https = require('follow-redirects').https;
const fs = require('fs');

const DIVISOR = 10000; // price divisor as before
const EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest/USD';

function safeNum(n) {
  return (n === null || n === undefined) ? null : n;
}

function formatCurrencyUnits(amount, currency) {
  if (amount === null) return '—';
  const curr = (currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${curr} ${amount.toFixed(2)}`;
  }
}

function fetchExchangeRate() {
  return new Promise((resolve, reject) => {
    https.get(EXCHANGE_API_URL, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response && response.result === 'success' && response.rates && response.rates.NGN) {
            resolve(response.rates.NGN);
          } else {
            reject(new Error('Failed to get NGN rate from open.er-api.com'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', err => reject(err));
  });
}

function fetchEsimPackages() {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      hostname: 'api.esimaccess.com',
      path: '/api/v1/open/package/list',
      headers: {
        'RT-AccessCode': '810aefbd00554ab681baa2ef7bd396b4', // replace with your key
        'Content-Type': 'application/json'
      },
      maxRedirects: 20
    };

    const req = https.request(options, res => {
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        try {
          const data = JSON.parse(body);
          if (!data.success || !data.obj || !Array.isArray(data.obj.packageList)) {
            reject(new Error('Unexpected API response from esimaccess'));
            return;
          }
          resolve(data.obj.packageList);
        } catch (err) {
          reject(err);
        }
      });
      res.on('error', err => reject(err));
    });

    const postData = JSON.stringify({
      locationCode: "",
      type: "",
      slug: "",
      packageCode: "",
      iccid: ""
    });

    req.write(postData);
    req.end();
  });
}

(async () => {
  try {
    const ngnRate = await fetchExchangeRate();
    console.log(`Current USD → NGN rate: ${ngnRate}`);

    let packages = await fetchEsimPackages();

    // Sort alphabetically by name
    packages.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>eSIM Packages with NGN Prices</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
    th { background-color: #f4f4f4; text-align: left; }
    .small { font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <h1>Available eSIM Packages</h1>
  <p>USD → NGN Exchange Rate: <strong>${ngnRate.toFixed(2)}</strong></p>
  <table>
    <tr>
      <th>Name</th>
      <th>Retail Price (NGN)</th>
      <th>Volume</th>
      <th>Duration</th>
    </tr>`;

    packages.forEach(pkg => {
      const retailRaw = safeNum(pkg.retailPrice);
      const retailUsd = retailRaw !== null ? retailRaw / DIVISOR : null;
      const retailNgn = retailUsd !== null ? retailUsd * ngnRate : null;

      const volumeStr = pkg.volume ? (pkg.volume / (1024 ** 3)).toFixed(2) + ' GB' : '—';
      const durationStr = pkg.duration ? `${pkg.duration} ${pkg.durationUnit || ''}` : '—';

      const firstLoc = (Array.isArray(pkg.locationNetworkList) && pkg.locationNetworkList.length > 0) ? pkg.locationNetworkList[0] : null;
      const flagImg = firstLoc ? `<img src="https://p.qrsim.net${firstLoc.locationLogo}" alt="${firstLoc.locationName}" style="height:18px; vertical-align:middle; margin-right:6px;">` : '';

      html += `
      <tr>
        <td>${flagImg}${pkg.name || '—'} <div class="small">${pkg.slug || ''}</div></td>
        <td>${formatCurrencyUnits(retailNgn, 'NGN')}</td>
        <td>${volumeStr}</td>
        <td>${durationStr}</td>
      </tr>`;
    });

    html += `
  </table>
</body>
</html>`;

    fs.writeFileSync('esim-packages.html', html, 'utf8');
    console.log('File saved as esim-packages.html — open it in your browser.');

  } catch (err) {
    console.error('Error:', err);
  }
})();
