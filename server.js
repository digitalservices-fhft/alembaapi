const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const qs = require('querystring');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json());

let access_token = '';

app.get('/get-token', (req, res) => {
  const options = {
    method: 'GET',
    hostname: 'fhnhs.alembacloud.com',
    path: '/production/alemba.web/oauth/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': process.env.CLIENT_ID
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
        access_token = json.access_token;
        res.json({ access_token });
      } catch (e) {
        res.status(500).send('Failed to parse token response');
      }
    });
  });

  const postData = qs.stringify({
    'Grant_type': 'password',
    'Scope': 'session-type:Analyst',
    'Client_id': process.env.CLIENT_ID,
    'Username': process.env.API_USERNAME,
    'Password': process.env.API_PASSWORD
  });

  request.write(postData);
  request.end();
});

app.post('/make-call', (req, res) => {
  const options = {
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: `/production//alemba.api/api/v2/call?Login_Token=${access_token}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': access_token
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

  request.write(JSON.stringify(req.body));
  request.end();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
