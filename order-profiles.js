var https = require('follow-redirects').https;
var fs = require('fs');

var options = {
  'method': 'POST',
  'hostname': 'api.esimaccess.com',
  'path': '/api/v1/open/esim/order',
  'headers': {
    'RT-AccessCode' : '810aefbd00554ab681baa2ef7bd396b4',
    'Content-Type' : 'application/json'
  },
  'maxRedirects': 20
};

var req = https.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function (chunk) {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });

  res.on("error", function (error) {
    console.error(error);
  });
});

/** var postData =  "{\n    \"transactionId\":\"your_txn_id\",\n    \"amount\":15000,\n    \"packageInfoList\": [{\n        \"packageCode\":\"7aa948d363\",\n        \"count\":1,\n        \"price\":15000\n    }]\n}";
 * */

const postData = JSON.stringify({
  transactionId: "",
  your_txn_id: "",
  packageInfoList: "",
  packageCode: "",
  count: ""
});

req.write(postData);

req.end();