const express = require('express');
const https = require('https');
const qs = require('querystring');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

let access_token = '';

app.get('/get-token', (req, res) => {
  const postData = qs.stringify({
    grant_type: 'password',
    scope: 'session-type:Analyst',
    client_id: process.env.CLIENT_ID,
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD
  });

  const options = {
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: '/production/alemba.web/oauth/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
      // Add Authorization header if API requires (e.g., Basic Auth)
    },
    maxRedirects: 20
  };

  const request = https.request(options, (response) => {
    let chunks = [];

    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      try {
        const json = JSON.parse(body);
        if (json.access_token) {
          access_token = json.access_token;
          res.json({ access_token });
        } else {
          res.status(500).send('No access_token in response');
        }
      } catch (e) {
        res.status(500).send('Failed to parse token response');
      }
    });
  });

  request.on('error', (err) => {
    res.status(500).send('Request failed: ' + err.message);
  });

  request.write(postData);
  request.end();
});

app.post('/make-call', (req, res) => {
  if (!access_token) {
    return res.status(401).send('No access token. Please authenticate first.');
  }

  const options = {
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: `/production/alemba.api/api/v2/call?Login_Token=${access_token}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token // or as required by your API
    },
    maxRedirects: 20
  };

  const request = https.request(options, (response) => {
    let chunks = [];

    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      res.send(body);
    });
  });

  request.on('error', (err) => {
    res.status(500).send('Request failed: ' + err.message);
  });

  request.write(JSON.stringify(req.body));
  request.end();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});