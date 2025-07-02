// server.js
require('dotenv').config();
const express = require('express');
const https = require('https');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());

let authToken = null;

// Endpoint to get the auth token
app.get('/api/get-token', (req, res) => {
  const qs = require('querystring');

  const postData = qs.stringify({
    'Grant_type': 'password',
    'Scope': 'session-type:Analyst',
    'Client_id': process.env.CLIENT_ID,
    'Username': process.env.USERNAME,
    'Password': process.env.PASSWORD
  });

  const options = {
    method: 'GET',
    hostname: 'fhnhs.alembacloud.com',
    path: '/production/alemba.web/oauth/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${authToken}`,
    },
    maxRedirects: 20
  };

  const request = https.request(options, function (response) {
    let chunks = [];

    response.on("data", function (chunk) {
      chunks.push(chunk);
    });

    response.on("end", function () {
      const body = Buffer.concat(chunks).toString();
      authToken = body;
      res.send({ token: body });
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(500).send("Error retrieving token");
    });
  });

  request.write(postData);
  request.end();
});

// Endpoint to submit a ticket
app.post('/api/submit-ticket', (req, res) => {
  const { ReceivingGroup, CustomString1, ConfigurationItemId } = req.body;

  const postData = JSON.stringify({
    "Description": "Logged Via Chris & Jon's Magic Api",
    "DescriptionHtml": "<p>Logged Via Chris & Jon's Magic Api</p>",
    "IpkStatus": 1,
    "IpkStream": 0,
    "Location": 23427,
    "Impact": 1,
    "Urgency": 4,
    "ReceivingGroup": ReceivingGroup,
    "Type": 149,
    "CustomString1": CustomString1,
    "ConfigurationItemId": ConfigurationItemId,
    "User": 34419
  });

  const options = {
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: '/production/alemba.api/api/v2/call?Login_Token=YzBmNDkxZTUtODJiMS00M2RiLWFmMWYtZTMyYTRiMzUxZTJl',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'Cookie': 'ASP.NET_SessionId=bcfyzi5obvwi2tjufqwe4zdw'
    },
    maxRedirects: 20
  };

  const request = https.request(options, function (response) {
    let chunks = [];

    response.on("data", function (chunk) {
      chunks.push(chunk);
    });

    response.on("end", function () {
      const body = Buffer.concat(chunks).toString();
      try {
        const json = JSON.parse(body);
        res.send({ ref: json.Ref });
      } catch (e) {
        res.status(500).send("Error parsing response");
      }
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(500).send("Error submitting ticket");
    });
  });

  request.write(postData);
  request.end();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
