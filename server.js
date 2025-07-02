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
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: '/production/alemba.web/oauth/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' process.env.CLIENT_ID
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
  const callPayload = {
    "Description": "Logged Via Chris & Jon's Magic Api",
    "DescriptionHtml": "<p>Logged Via Chris & Jon's Magic Api</p>",
    "IpkStatus": 1,
    "IpkStream": 0,
    "Location": 23427,
    "Impact": 1,
    "Urgency": 4,
    "ReceivingGroup": 13,
    "Type": 149,
    "CustomString1": "Big Board ED Hub - Frimley",
    "ConfigurationItemId": 5430,
    "User": 34419
  };

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
        return res.status(500).send('Call created but no Ref returned');
      }

      // Step 2: Submit the call using the Ref
      const submitOptions = {
        method: 'POST',
        hostname: 'fhnhs.alembacloud.com',
        path: `/production//alemba.api/api/v2/call/${ref}/submit?Login_Token=${access_token}`,
        headers: {
          'Authorization': access_token
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
