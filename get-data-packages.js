var https = require('follow-redirects').https;
var fs = require('fs');

var options = {
  'method': 'POST',
  'hostname': 'api.esimaccess.com',
  'path': '/api/v1/open/package/list',
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

const postData = JSON.stringify({
  locationCode: "",
  type: "",
  slug: "NA-3_1_7",
  packageCode: "",
  iccid: ""
});

req.write(postData);

req.end();