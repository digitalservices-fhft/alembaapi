const express = require('express');
const https = require('https');
const qs = require('querystring');
const path = require('path');
const fs = require('fs');
const app = express();
const FormData = require('form-data');
const axios = require('axios');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;

// Environment variables for Render
const CLIENT_ID = process.env.CLIENT_ID || 'your_client_id';
const API_USERNAME = process.env.API_USERNAME || 'your_api_username';
const API_PASSWORD = process.env.API_PASSWORD || 'your_api_password';

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route '/easteregg' to send game.html
app.get('/easteregg', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Token cache
let access_token = '';
let token_expiry = 0;

// Auth token endpoint required for all applications
app.get('/get-token', (req, res) => {
  const now = Date.now();
  if (access_token && now < token_expiry) {
    res.set('Cache-Control', 'private, max-age=300');
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
          token_expiry = Date.now() + (4.5 * 60 * 1000);
          res.set('Cache-Control', 'private, max-age=300');
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

// Main API endpoint for calls
app.post('/make-call', upload.single('attachment'), async (req, res) => {
  const now = Date.now();
  if (!access_token || now >= token_expiry) {
    return res.status(401).send('Access token expired or missing. Please refresh the page.');
  }

  const codeType = req.query.codeType || req.body.codeType;
  const validTypes = ['call', 'stock', 'inf'];  
  if (!validTypes.includes(codeType)) {
  return res.status(400).send('Invalid codeType');
}


  if (codeType === 'inf') {
    const { receivingGroup, customString1, configurationItemId, type, impact, urgency } = req.query;
    const description = req.body.description;

    if (!impact || !urgency || !customString1 || !description) {
      return res.status(400).send('Missing required parameters for inf call');
    }

    const callPayload = {
      Description: description,
      DescriptionHtml: `<div>${description}</div>`,
      IpkStatus: 1,
      IpkStream: 0,
      Impact: parseInt(impact, 10),
      Urgency: parseInt(urgency, 10),
      ReceivingGroup: parseInt(receivingGroup, 10),
      Type: parseInt(type, 10),
      CustomString1: customString1,
      ConfigurationItemId: parseInt(configurationItemId, 10),
      User: 34419
    };

    try {
      const createCallUrl = `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call?Login_Token=${access_token}`;
      const createRes = await axios.post(createCallUrl, callPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      });

      const ref = createRes.data.Ref;
      if (!ref) {
        return res.status(500).send('Call created but no Ref returned. Response: ' + JSON.stringify(createRes.data));
      }

      if (req.file) {
        const form = new FormData();
        form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
        await axios.post(
          `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call/${ref}/attachments?Login_Token=${access_token}`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              Authorization: `Bearer ${access_token}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );
        fs.unlink(req.file.path, () => {});
      }

      const submitUrl = `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call/${ref}/submit?Login_Token=${access_token}`;
      const submitRes = await axios.put(submitUrl, null, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        }
      });

      res.send({
        message: 'Call created, attachment uploaded (if any), and submitted successfully',
        callRef: ref,
        submitResponse: submitRes.data
      });
    } catch (e) {
      res.status(500).send('Error in call creation and/or file upload/submission: ' +
        (e.response?.data ? JSON.stringify(e.response.data) : e.message));
    }
  } else if (codeType === 'stock') {
    const { purchase, transactionStatus, quantity } = req.body;
    const stockPayload = {
      Person: 34419,
      Purchase: parseInt(purchase, 10),
      Quantity: parseInt(quantity, 10),
      TransactionStatus: parseInt(transactionStatus, 10)
    };

    const options = {
      method: 'POST',
      hostname: 'fhnhs.alembacloud.com',
      path: `/production/alemba.api/api/v2/inventory-allocation?Login_Token=${access_token}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      maxRedirects: 20
    };

    const reqStock = https.request(options, (resStock) => {
      let chunks = [];
      resStock.on('data', (chunk) => chunks.push(chunk));
      resStock.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        let ref;
        try {
          const json = JSON.parse(body);
          ref = json.Ref;
        } catch (e) {
          return res.status(500).send('Failed to parse inventory allocation response');
        }

        if (!ref) {
          return res.status(500).send('No Ref returned from inventory allocation');
        }

        const submitOptions = {
          method: 'PUT',
          hostname: 'fhnhs.alembacloud.com',
          path: `/production/alemba.api/api/v2/inventory-allocation/${ref}/submit?Login_Token=${access_token}`,
          headers: { 'Authorization': `Bearer ${access_token}` },
          maxRedirects: 20
        };

        const submitReq = https.request(submitOptions, (submitRes) => {
          let submitChunks = [];
          submitRes.on('data', (chunk) => submitChunks.push(chunk));
          submitRes.on('end', () => {
            const submitBody = Buffer.concat(submitChunks).toString();
            res.send({
              message: 'Inventory allocation created and submitted successfully',
              callRef: ref,
              submitResponse: submitBody
            });
          });
        });

        submitReq.on('error', (e) => {
          res.status(500).send('Error submitting inventory allocation: ' + e.message);
        });

        submitReq.end();
      });
    });

    reqStock.on('error', (e) => {
      res.status(500).send('Error creating inventory allocation: ' + e.message);
    });

    reqStock.write(JSON.stringify(stockPayload));
    reqStock.end();
  } else {
    const {
      receivingGroup,
      customString1,
      configurationItemId,
      type,
      impact,
      urgency,
      description
    } = req.query;

    if (!receivingGroup || !customString1 || !configurationItemId || !type || !impact || !urgency || !description) {
      return res.status(400).send('Missing required parameters for call creation');
    }

    const callPayload = {
      Description: description,
      DescriptionHtml: `<p>${description}</p>`,
      IpkStatus: 1,
      IpkStream: 0,
      Impact: parseInt(impact, 10),
      Urgency: parseInt(urgency, 10),
      ReceivingGroup: parseInt(receivingGroup, 10),
      Type: parseInt(type, 10),
      CustomString1: customString1,
      ConfigurationItemId: parseInt(configurationItemId, 10),
      User: 34419
    };

    try {
      const createRes = await axios.post(
        `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call?Login_Token=${access_token}`,
        callPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
          }
        }
      );

      const ref = createRes.data.Ref;
      if (!ref) {
        return res.status(500).send(
          'Call created but no Ref returned. Response: ' + JSON.stringify(createRes.data)
        );
      }

      const submitRes = await axios.put(
        `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call/${ref}/submit?Login_Token=${access_token}`,
        null,
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );

      res.send({
        message: 'Call created and submitted successfully',
        callRef: ref,
        submitResponse: submitRes.data
      });
    } catch (e) {
      res.status(500).send(
        'Error creating or submitting call: ' +
        (e.response?.data ? JSON.stringify(e.response.data) : e.message)
      );
    }
  }
}); // CLOSE app.post('/make-call')

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});