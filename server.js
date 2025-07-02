// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const https = require('https');
const qs = require('querystring');

// Create Express app
const app = express();

// Middleware to parse JSON (optional, useful for future expansion)
app.use(express.json());

// Route to get OAuth token
app.get('/api/token', (req, res) => {
  // Validate required environment variables
  const { CLIENT_ID, USERNAME, PASSWORD, AUTHORIZATION_HEADER } = process.env;
  if (!CLIENT_ID || !USERNAME || !PASSWORD || !AUTHORIZATION_HEADER) {
    return res.status(500).json({ error: 'Missing required environment variables' });
  }

  // Prepare POST data
  const postData = qs.stringify({
    grant_type: 'password',
    scope: 'session-type:Analyst',
    client_id: CLIENT_ID,
    username: USERNAME,
    password: PASSWORD
  });

  // HTTPS request options
  const options = {
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: '/production/alemba.web/oauth/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': AUTHORIZATION_HEADER
    },
    maxRedirects: 20
  };

  // Make the HTTPS request
  const apiReq = https.request(options, (apiRes) => {
    let chunks = [];

    apiRes.on('data', (chunk) => {
      chunks.push(chunk);
    });

    apiRes.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      console.log('API Response:', body);

      try {
        const json = JSON.parse(body);
        if (json.access_token) {
          res.json({ access_token: json.access_token });
        } else {
          res.status(500).json({ error: 'No access_token in response', raw: json });
        }
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse response', raw: body });
      }
    });
  });

  // Handle request errors
  apiReq.on('error', (error) => {
    console.error('API Request Error:', error);
    res.status(500).json({ error: 'API request failed', details: error.message });
  });

  // Send POST data
  apiReq.write(postData);
  apiReq.end();
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
