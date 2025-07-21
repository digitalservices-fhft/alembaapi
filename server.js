const express = require('express');
const path = require('path');
const multer = require('multer');
const qs = require('querystring');
const axios = require('axios'); // Use axios for all HTTP(S) requests
const app = express();

// File upload middleware (if needed in future endpoints)
const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 3000;

// Securely load sensitive credentials from environment at runtime
const CLIENT_ID = process.env.CLIENT_ID || 'your_client_id';
const API_USERNAME = process.env.API_USERNAME || 'your_api_username';
const API_PASSWORD = process.env.API_PASSWORD || 'your_api_password';

// Static files middleware: serve from public/ directory
app.use(express.static('public'));

// JSON and URL-encoded parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Easter egg route: delivers a static HTML page
app.get('/easteregg', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// In-memory token cache
let access_token = '';
let token_expiry = 0;

/**
 * Auth token endpoint required for all applications.
 * Uses axios for the outbound login request (OAuth grant).
 * Token is reused if not expired.
 */
app.get('/get-token', async (req, res) => {
  const now = Date.now();

  // Return cached token if still valid
  if (access_token && now < token_expiry) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.json({ access_token });
  }

  // Prepare OAuth login payload
  const postData = qs.stringify({
    grant_type: 'password',
    scope: 'session-type:Analyst',
    client_id: CLIENT_ID,
    username: API_USERNAME,
    password: API_PASSWORD,
  });

  try {
    // Request token with axios
    const axiosRes = await axios.post(
      'https://fhnhs.alembacloud.com/production/alemba.web/oauth/login',
      postData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const json = axiosRes.data;

    if (json.access_token) {
      access_token = json.access_token;
      // Set token to expire in 4.5 minutes (server config allows 5 min)
      token_expiry = Date.now() + 4.5 * 60 * 1000;
      res.set('Cache-Control', 'private, max-age=300'); // Instruct browser to cache for 5 min
      return res.json({ access_token });
    } else {
      res.status(500).send('No access_token in response');
    }
  } catch (error) {
    // Surface error message if OAuth fails (e.g., network or credentials error)
    res.status(500).send(
      'Error requesting token: ' +
        (error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message)
    );
  }
});

/**
 * Main API endpoint for making calls to Alemba.
 * Handles "inf" codeType (Information or similar) ONLY.
 * All outbound requests use axios for consistency.
 * Assumes the frontend provides a valid access token.
 */
app.post('/make-call', upload.single('attachment'), async (req, res) => {
  const now = Date.now();

  // Check token validity
  if (!access_token || now >= token_expiry) {
    return res
      .status(401)
      .send('Access token expired or missing. Please refresh the page.');
  }

  // Get codeType from query or body
  const codeType = req.query.codeType || req.body.codeType;

  if (codeType === 'inf') {
    // Only supports "inf" mode in this snippet
    // Get parameters from query string and request body
    const {
      receivingGroup,
      customString1,
      configurationItemId,
      type,
      impact,
      urgency,
    } = req.query;
    const description = req.body.description;

    // Validate required parameters
    if (!impact || !urgency || !customString1 || !description) {
      return res
        .status(400)
        .send('Missing required parameters for inf call');
    }

    // Prepare the call object for Alemba API, ensuring numeric fields are sent as numbers
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
      User: 34419, // Adjust this to be dynamic if required
    };

    try {
      // 1. Create the call (POST)
      const createCallUrl = `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call?Login_Token=${access_token}`;

      const createRes = await axios.post(createCallUrl, callPayload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      });

      const ref = createRes.data.Ref;

      if (!ref) {
        return res
          .status(500)
          .send(
            'Call created but no Ref returned. Response: ' +
              JSON.stringify(createRes.data)
          );
      }

      // 2. Submit the call (PUT)
      const submitUrl = `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call/${ref}/submit?Login_Token=${access_token}`;
      const submitRes = await axios.put(
        submitUrl,
        null,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      // Respond with outcome and references
      res.send({
        message: 'Call created and submitted successfully',
        callRef: ref,
        submitResponse: submitRes.data,
      });
    } catch (err) {
      // Catch and format API or network errors for debugging
      res.status(500).send(
        'Error in call creation/submission: ' +
          (err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message)
      );
    }
  } else {
    // If unsupported codeType is provided, return 400
    res.status(400).send('Unsupported codeType specified.');
  }
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});