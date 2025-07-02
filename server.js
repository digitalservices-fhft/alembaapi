const https = require('https');
const qs = require('querystring');

app.get('/api/token', (req, res) => {
  const postData = qs.stringify({
    grant_type: 'password',
    scope: 'session-type:Analyst',
    client_id: process.env.CLIENT_ID,
    username: process.env.USERNAME,
    password: process.env.PASSWORD
  });

  const options = {
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: '/production/alemba.web/oauth/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': process.env.AUTHORIZATION_HEADER
    },
    maxRedirects: 20
  };

  const apiReq = https.request(options, function (apiRes) {
    let chunks = [];

    apiRes.on("data", function (chunk) {
      chunks.push(chunk);
    });

    apiRes.on("end", function () {
      const body = Buffer.concat(chunks).toString();
      console.log("API Response:", body);

      try {
        const json = JSON.parse(body);
        if (json.access_token) {
          res.json({ access_token: json.access_token });
        } else {
          res.status(500).json({ error: "No access_token in response", raw: json });
        }
      } catch (e) {
        res.status(500).json({ error: "Failed to parse response", raw: body });
      }
    });
  });

  apiReq.on("error", function (error) {
    console.error("API Request Error:", error);
    res.status(500).json({ error: "API request failed", details: error.message });
  });

  apiReq.write(postData);
  apiReq.end();
});
