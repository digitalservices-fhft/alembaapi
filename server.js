// server.js
const express = require('express');
const https = require('https');
const qs = require('querystring');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Replace these with your actual credentials or use environment variables
const CLIENT_ID = process.env.CLIENT_ID || 'your_client_id';
const API_USERNAME = process.env.API_USERNAME || 'your_api_username';
const API_PASSWORD = process.env.API_PASSWORD || 'your_api_password';

app.use(express.static('public'));
app.use(express.json());

// In-memory token cache
let access_token = '';
let token_expiry = 0; // Unix timestamp in ms

// GET TOKEN ENDPOINT
app.get('/get-token', (req, res) => {
  const now = Date.now();
  // If token is still valid, return cached token
  if (access_token && now < token_expiry) {
    res.set('Cache-Control', 'private, max-age=300'); // 5 min cache
    return res.json({ access_token });
  }

  const postData = qs.stringify({
    grant_type: 'password',
    scope: 'session-type:Analyst',
    client_id: CLIENT_ID,
    username: API_USERNAME,
    password: API_PASSWORD
  });

  const options = {
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: '/production/alemba.web/oauth/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
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
          // Set expiry to 4.5 minutes from now (token is usually valid for 5 min)
          token_expiry = Date.now() + (4.5 * 60 * 1000);
          res.set('Cache-Control', 'private, max-age=300');
          res.json({ access_token });
        } else {
          console.error('No access_token in response:', body);
          res.status(500).send('No access_token in response');
        }
      } catch (e) {
        console.error('Failed to parse token response:', e, body);
        res.status(500).send('Failed to parse token response');
      }
    });
  });

  request.on('error', (e) => {
    console.error('Error requesting token:', e);
    res.status(500).send('Error requesting token: ' + e.message);
  });

  request.write(postData);
  request.end();
});

// MAKE CALL ENDPOINT
app.post('/make-call', (req, res) => {
  if (!access_token) {
    return res.status(401).send('No access token. Please authenticate first.');
  }

  // Extract parameters
  const {
    receivingGroup,
    customString1,
    configurationItemId,
    type,
    description,
    impact,
    urgency
  } = req.body;

  // Validate required parameters
  if (
    !receivingGroup ||
    !customString1 ||
    !configurationItemId ||
    !type ||
    !description ||
    impact === undefined ||
    urgency === undefined
  ) {
    return res.status(400).send('Missing required parameters: receivingGroup, customString1, configurationItemId, type, description, impact, and urgency');
  }

  // Use the description for both Description and DescriptionHtml
   const callPayload = {
    Description: description,
    DescriptionHtml: `<p>${description}</p>`,
    IpkStatus: 1,
    IpkStream: 0,
    Location: 23427,
    Impact: parseInt(impact, 10),
    Urgency: parseInt(urgency, 10),
    ReceivingGroup: parseInt(receivingGroup, 10),
    Type: parseInt(type, 10),
    CustomString1: customString1,
    ConfigurationItemId: parseInt(configurationItemId, 10),
    User: 34419
 };

  const options = {
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: `/production/alemba.api/api/v2/call?Login_Token=${access_token}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    maxRedirects: 20
  };

  const callReq = https.request(options, (callRes) => {
    let chunks = [];
    callRes.on('data', (chunk) => chunks.push(chunk));
    callRes.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      let ref;
      try {
        const json = JSON.parse(body);
        ref = json.Ref;
      } catch (e) {
        return res.status(500).send('Failed to parse call creation response');
      }
      if (!ref) {
        return res.status(500).send('Call created but no Ref returned. Response: ' + body);
      }
      // Step 2: Submit the call using the Ref
      const submitOptions = {
        method: 'PUT',
        hostname: 'fhnhs.alembacloud.com',
        path: `/production/alemba.api/api/v2/call/${ref}/submit?Login_Token=${access_token}`,
        headers: {
          'Authorization': `Bearer ${access_token}`
        },
        maxRedirects: 20
      };
      const submitReq = https.request(submitOptions, (submitRes) => {
        let submitChunks = [];
        submitRes.on('data', (chunk) => submitChunks.push(chunk));
        submitRes.on('end', () => {
          const submitBody = Buffer.concat(submitChunks).toString();
          res.send({
            message: 'Call created and submitted successfully',
            callRef: ref,
            submitResponse: submitBody
          });
        });
      });
      submitReq.on('error', (e) => {
        res.status(500).send('Error submitting call: ' + e.message);
      });
      submitReq.end();
    });
  });

  callReq.on('error', (e) => {
    res.status(500).send('Error creating call: ' + e.message);
  });

  callReq.write(JSON.stringify(callPayload));
  callReq.end();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
