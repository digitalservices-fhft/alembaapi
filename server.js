
// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://ajax.googleapis.com",   // Allow Google CDN for Bootstrap & jQuery
          "'unsafe-inline'"                // (Optional) Allow inline scripts if needed
        ],
        styleSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",      // Allow Bootstrap CSS from jsdelivr
          "'unsafe-inline'"                // Allow inline styles (Bootstrap needs this)
        ]
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Validate environment variables
['USERNAME', 'PASSWORD', 'CLIENT_ID'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
});

// Token cache
let tokenCache = {
  token: null,
  expiresAt: 0
};

// Helper: Get OAuth token (refresh if expired)
async function getAuthToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now + 60000) {
    return tokenCache.token;
  }
  const url = 'https://fhnhs.alembacloud.com/production/alemba.web/oauth/login';
  const params = new URLSearchParams({
    Grant_type: 'password',
    Scope: 'session-type:Analyst',
    Client_id: process.env.CLIENT_ID,
    Username: process.env.USERNAME,
    Password: process.env.PASSWORD
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!res.ok) {
    throw new Error('Failed to get auth token');
  }
  const data = await res.json();
  // Assume data.access_token and data.expires_in are present
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + ((data.expires_in || 600) * 1000);
  return tokenCache.token;
}

// API endpoint: Submit ticket
app.post('/api/submit-ticket', async (req, res) => {
  try {
    const { ReceivingGroup, CustomString1, ConfigurationItemId } = req.body;
    // Validate required params
    if (
      !ReceivingGroup ||
      !CustomString1 ||
      !ConfigurationItemId
    ) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const token = await getAuthToken();

    // Compose the ticket payload as per Alemba API cookbook
    const ticketPayload = {
      Description: "Logged Via Chris & Jon's Magic Api",
      DescriptionHtml: "<p>Logged Via Chris & Jon's Magic Api</p>",
      IpkStatus: 1,
      IpkStream: 0,
      Location: 23427,
      Impact: 1,
      Urgency: 4,
      ReceivingGroup: parseInt(ReceivingGroup),
      Type: 149,
      CustomString1: CustomString1,
      ConfigurationItemId: parseInt(ConfigurationItemId),
      User: 34419
    };

    // Submit the ticket
    const apiUrl = 'https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call';
    const apiRes = await fetch(`${apiUrl}?Login_Token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(ticketPayload)
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok || !apiData.Ref) {
      return res.status(500).json({ error: 'Failed to log ticket', details: apiData });
    }

    res.json({ ref: apiData.Ref });
  } catch (error) {
    console.error('Error submitting ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
