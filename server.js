app.post('/make-call', (req, res) => {
  if (!access_token) {
    return res.status(401).send('No access token. Please authenticate first.');
  }

  // Prefer body, fallback to query
  const receivingGroup = req.body.receivingGroup || req.query.receivingGroup || 13;
  const customString1 = req.body.customString1 || req.query.customString1 || "Big Board ED Hub - Frimley";
  const configurationItemId = req.body.configurationItemId || req.query.configurationItemId || 5430;
  const type = req.body.type || req.query.type || 143;
  const description = req.body.description || req.query.description || "Ticket logged via API";

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

      // Submit the call using the Ref
      const submitOptions = {
        method: 'POST',
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
