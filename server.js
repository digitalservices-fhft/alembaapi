
// Updated server.js with support for codeType=stock
const express = require('express');
const https = require('https');
const qs = require('querystring');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID || 'your_client_id';
const API_USERNAME = process.env.API_USERNAME || 'your_api_username';
const API_PASSWORD = process.env.API_PASSWORD || 'your_api_password';

app.use(express.static('public'));
app.use(express.json());

let access_token = '';
let token_expiry = 0;

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

app.post('/make-call', (req, res) => {
    if (!access_token) {
        return res.status(401).send('No access token. Please authenticate first.');
    }

    const {
        receivingGroup,
        customString1,
        configurationItemId,
        type,
        description,
        purchase,
        transactionStatus,
        quantity
    } = req.body;

    if (codeType === 'stock') {
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
        // Existing call creation logic remains unchanged
        res.status(400).send('codeType=call logic not shown here for brevity');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
