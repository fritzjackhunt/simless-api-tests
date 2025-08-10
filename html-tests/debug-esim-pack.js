// debug-esim-prices.js
const https = require('follow-redirects').https;
const fs = require('fs');

const options = {
  method: 'POST',
  hostname: 'api.esimaccess.com',
  path: '/api/v1/open/package/list',
  headers: {
    'RT-AccessCode': '810aefbd00554ab681baa2ef7bd396b4', // replace if needed
    'Content-Type': 'application/json'
  },
  maxRedirects: 20
};

function safeNum(n) {
  return (n === null || n === undefined) ? '—' : String(n);
}
function conv(n, d) {
  if (n === null || n === undefined) return '—';
  return (n / d).toFixed(2);
}

const req = https.request(options, res => {
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    let body = Buffer.concat(chunks).toString();
    let data;
    try { data = JSON.parse(body); } catch(e) {
      console.error('Invalid JSON:', e);
      console.log('RAW BODY:', body);
      return;
    }

    if (!data.success || !data.obj || !Array.isArray(data.obj.packageList)) {
      console.error('Unexpected API response:', data);
      return;
    }

    const pkgs = data.obj.packageList;

    let html = `<!doctype html>
<html><head><meta charset="utf-8"><title>eSIM Price Debug</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;padding:18px}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}
  th{background:#f3f3f3}
  img{height:16px;vertical-align:middle;margin-right:6px}
  .small{font-size:0.9em;color:#666}
</style>
</head><body>
<h1>eSIM Price Debug</h1>
<p>This table shows RAW API integers and conversions (divide by 100, 1000, 10000). Pick the one that matches your expected prices.</p>
<table>
<tr>
<th>Package Code</th>
<th>Name</th>
<th>Currency</th>
<th>Raw Price</th>
<th>Raw RetailPrice</th>
<th>Price ÷ 100</th>
<th>Retail ÷ 100</th>
<th>Price ÷ 1000</th>
<th>Retail ÷ 1000</th>
<th>Price ÷ 10000</th>
<th>Retail ÷ 10000</th>
<th>Countries</th>
</tr>`;

    pkgs.forEach(pkg => {
      const countries = Array.isArray(pkg.locationNetworkList)
        ? pkg.locationNetworkList.map(l => `<div><img src="https://p.qrsim.net${l.locationLogo}" alt="${l.locationName}">${l.locationName}</div>`).join('')
        : '—';

      html += `<tr>
<td>${pkg.packageCode || '—'}</td>
<td>${(pkg.name || '—')} <div class="small">${pkg.slug || ''}</div></td>
<td>${pkg.currencyCode || '—'}</td>
<td>${safeNum(pkg.price)}</td>
<td>${safeNum(pkg.retailPrice)}</td>
<td>${conv(pkg.price, 100)}</td>
<td>${conv(pkg.retailPrice, 100)}</td>
<td>${conv(pkg.price, 1000)}</td>
<td>${conv(pkg.retailPrice, 1000)}</td>
<td>${conv(pkg.price, 10000)}</td>
<td>${conv(pkg.retailPrice, 10000)}</td>
<td>${countries}</td>
</tr>`;
    });

    html += `</table>
</body></html>`;

    fs.writeFileSync('esim-prices-debug.html', html, 'utf8');
    console.log('Wrote esim-prices-debug.html — open it in your browser and check which conversion looks correct.');
  });

  res.on('error', err => {
    console.error('Response error:', err);
  });
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
