const express = require('express');
const https = require('https');
const qs = require('querystring');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.json());

let access_token = '';

// GET TOKEN ENDPOINT
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

  request.on('error', (e) => {
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

  // Extract other parameters with fallback defaults
  const receivingGroup = req.body.receivingGroup || req.query.receivingGroup;
  const customString1 = req.body.customString1 || req.query.customString1;
  const configurationItemId = req.body.configurationItemId || req.query.configurationItemId;
  const type = req.body.type || req.query.type;
  const description = req.body.description || req.query.description;

  const callPayload = {
    "Description": description,
    "DescriptionHtml": `<p>${description}</p>`,
    "IpkStatus": 1,
    "IpkStream": 0,
    "Location": 23427,
    "Impact": 1,
    "Urgency": 4,
    "ReceivingGroup": parseInt(receivingGroup, 10),
    "Type": parseInt(type, 10),
    "CustomString1": customString1,
    "ConfigurationItemId": parseInt(configurationItemId, 10),
    "User": 34419
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
