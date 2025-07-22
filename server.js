// server.js - Corrected version with proper Node.js syntax
const express = require('express');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const { body, validationResult } = require('express-validator');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// CONFIGURATION AND VALIDATION
// ============================================================================

const requiredEnvVars = ['API_BASE_URL', 'API_CLIENT_ID', 'API_CLIENT_SECRET'];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
});

const config = {
    api: {
        baseURL: process.env.API_BASE_URL,
        clientId: process.env.API_CLIENT_ID,
        clientSecret: process.env.API_CLIENT_SECRET,
        timeout: parseInt(process.env.API_TIMEOUT) || 30000,
        retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 3,
        retryDelay: parseInt(process.env.API_RETRY_DELAY) || 1000
    },
    server: {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info'
    }
};

// ============================================================================
// CACHING AND UTILITIES
// ============================================================================

const tokenCache = new NodeCache({ 
    stdTTL: 3300,
    checkperiod: 300
});

let tokenRefreshPromise = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logger = {
    info: (message, meta = {}) => {
        if (config.server.nodeEnv === 'development') {
            console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta);
        }
    },
    error: (message, error = {}, meta = {}) => {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, {
            error: error.message || error,
            stack: error.stack,
            ...meta
        });
    },
    warn: (message, meta = {}) => {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, meta);
    }
};

// ============================================================================
// AXIOS CONFIGURATION
// ============================================================================

const alembaApiClient = axios.create({
    baseURL: `${config.api.baseURL}/production/alemba.api/api/v2`,
    timeout: config.api.timeout,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

const authClient = axios.create({
    baseURL: config.api.baseURL,
    timeout: config.api.timeout,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
    }
});

// Request interceptor for API authentication
alembaApiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await getAccessToken();
            config.headers.Authorization = `Bearer ${token}`;
            logger.info('Added authorization header to request', { url: config.url });
            return config;
        } catch (error) {
            logger.error('Failed to add authorization header', error);
            return Promise.reject(error);
        }
    },
    (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
alembaApiClient.interceptors.response.use(
    (response) => {
        logger.info('API request successful', { 
            url: response.config.url, 
            status: response.status 
        });
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            logger.warn('Received 401 response, attempting token refresh');
            originalRequest._retry = true;

            try {
                tokenCache.del('access_token');
                const newToken = await getAccessToken();
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                
                logger.info('Token refreshed, retrying original request');
                return alembaApiClient(originalRequest);
            } catch (refreshError) {
                logger.error('Token refresh failed', refreshError);
                tokenCache.del('access_token');
                return Promise.reject(refreshError);
            }
        }

        logger.error('API request failed', error, {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText
        });

        return Promise.reject(error);
    }
);

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://code.jquery.com"],
            imgSrc: ["'self'", "", "https:"],
            connectSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        (config.server.nodeEnv === 'development' ? true : false),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

async function getAccessToken() {
    const cachedToken = tokenCache.get('access_token');
    if (cachedToken) {
        logger.info('Using cached access token');
        return cachedToken;
    }

    if (tokenRefreshPromise) {
        logger.info('Token refresh in progress, waiting...');
        return await tokenRefreshPromise;
    }

    tokenRefreshPromise = refreshAccessToken();

    try {
        const token = await tokenRefreshPromise;
        tokenRefreshPromise = null;
        return token;
    } catch (error) {
        tokenRefreshPromise = null;
        throw error;
    }
}

async function refreshAccessToken() {
    logger.info('Refreshing access token');

    for (let attempt = 1; attempt <= config.api.retryAttempts; attempt++) {
        try {
            const tokenData = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: config.api.clientId,
                client_secret: config.api.clientSecret
            });

            const response = await authClient.post('/production/alemba.api/oauth/token', tokenData);

            if (response.data && response.data.access_token) {
                const token = response.data.access_token;
                const expiresIn = response.data.expires_in || 3600;
                
                tokenCache.set('access_token', token, Math.max(expiresIn - 300, 300));
                
                logger.info('Access token refreshed successfully', { 
                    expiresIn: expiresIn, 
                    attempt: attempt 
                });
                
                return token;
            } else {
                throw new Error('Invalid token response format');
            }

        } catch (error) {
            logger.error(`Token refresh attempt ${attempt} failed`, error);

            if (attempt === config.api.retryAttempts) {
                throw new Error(`Failed to refresh token after ${config.api.retryAttempts} attempts: ${error.message}`);
            }

            const delay = config.api.retryDelay * Math.pow(2, attempt - 1);
            logger.info(`Retrying token refresh in ${delay}ms...`);
            await sleep(delay);
        }
    }
}

// ============================================================================
// API SERVICE FUNCTIONS - CORRECTED SYNTAX
// ============================================================================

async function makeApiCall(endpoint, method = 'GET', data = null, retries = config.api.retryAttempts) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            logger.info(`Making API call`, { endpoint: endpoint, method: method, attempt: attempt });

            const requestConfig = {
                method: method.toLowerCase(),
                url: endpoint
            };

            if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
                requestConfig.data = data;
            }

            const response = await alembaApiClient(requestConfig);
            
            logger.info('API call successful', { 
                endpoint: endpoint, 
                method: method, 
                status: response.status 
            });

            // CORRECTED: Fixed object literal syntax
            const result = {
                success: true,
                data: response.data,
                status: response.status,
                headers: response.headers
            };
            
            return result;

        } catch (error) {
            logger.error(`API call attempt ${attempt} failed`, error, { 
                endpoint: endpoint, 
                method: method 
            });

            if (error.response?.status >= 400 && 
                error.response?.status < 500 && 
                ![401, 429].includes(error.response.status)) {
                logger.warn('Client error detected, not retrying', { status: error.response.status });
                break;
            }

            if (attempt === retries) {
                throw error;
            }

            const baseDelay = config.api.retryDelay * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 1000;
            const delay = baseDelay + jitter;
            
            logger.info(`Retrying API call in ${Math.round(delay)}ms...`);
            await sleep(delay);
        }
    }
}

function handleApiError(error, operation = 'API operation') {
    const errorResponse = {
        success: false,
        error: 'An error occurred',
        operation: operation,
        timestamp: new Date().toISOString()
    };

    if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        
        errorResponse.status = status;
        errorResponse.statusText = statusText;

        switch (status) {
            case 400:
                errorResponse.error = 'Bad request - please check your input data';
                break;
            case 401:
                errorResponse.error = 'Authentication failed - please check your credentials';
                break;
            case 403:
                errorResponse.error = 'Access forbidden - insufficient permissions';
                break;
            case 404:
                errorResponse.error = 'Resource not found';
                break;
            case 429:
                errorResponse.error = 'Rate limit exceeded - please try again later';
                break;
            case 500:
                errorResponse.error = 'Internal server error - please try again later';
                break;
            default:
                errorResponse.error = `Server error: ${statusText}`;
        }

        if (config.server.nodeEnv === 'development' && error.response.data) {
            errorResponse.details = error.response.data;
        }

    } else if (error.request) {
        if (error.code === 'ECONNABORTED') {
            errorResponse.error = 'Request timeout - please try again';
        } else if (error.code === 'ENOTFOUND') {
            errorResponse.error = 'Network error - please check your connection';
        } else {
            errorResponse.error = 'Network error occurred';
        }
        errorResponse.code = error.code;

    } else {
        errorResponse.error = config.server.nodeEnv === 'development' ? 
            error.message : 
            'An unexpected error occurred';
    }

    return errorResponse;
}

// ============================================================================
// INPUT VALIDATION MIDDLEWARE
// ============================================================================

const validateCallData = [
    body('codeType')
        .trim()
        .isIn(['call', 'stock'])
        .withMessage('codeType must be either "call" or "stock"'),
    
    body('description')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Description is required and must be less than 500 characters')
        .escape(),
    
    body('purchase')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Purchase reference must be less than 50 characters')
        .escape(),
    
    body('quantity')
        .optional()
        .isNumeric()
        .withMessage('Quantity must be a number'),
    
    body('transactionStatus')
        .optional()
        .isIn(['1', '2', '3'])
        .withMessage('Transaction status must be 1, 2, or 3')
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation errors detected', { errors: errors.array() });
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// ============================================================================
// ROUTES AND ENDPOINTS
// ============================================================================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.server.nodeEnv,
        version: process.env.npm_package_version || '1.0.0'
    });
});

app.get('/api/get-token', async (req, res) => {
    try {
        logger.info('Token request received');
        
        const token = await getAccessToken();
        
        res.json({
            success: true,
            access_token: token,
            token_type: 'Bearer',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Token request failed', error);
        const errorResponse = handleApiError(error, 'get access token');
        res.status(500).json(errorResponse);
    }
});

app.post('/api/make-call', validateCallData, handleValidationErrors, async (req, res) => {
    try {
        logger.info('Call creation request received', { 
            codeType: req.body.codeType,
            hasDescription: !!req.body.description 
        });

        const { codeType, description, purchase, quantity, transactionStatus } = req.body;

        let apiPayload;
        let endpoint;

        if (codeType === 'stock') {
            apiPayload = {
                shortDescription: description,
                purchase: purchase || '',
                quantity: parseInt(quantity) || 1,
                transactionStatus: transactionStatus || '1'
            };
            endpoint = '/inventoryAllocation';
            
        } else {
            apiPayload = {
                shortDescription: description,
                priority: '3',
                category: 'General',
                status: 'Open'
            };
            endpoint = '/call';
        }

        logger.info('Making API call', { endpoint: endpoint, codeType: codeType });

        const result = await makeApiCall(endpoint, 'POST', apiPayload);

        if (result.success) {
            const callRef = result.data?.ref || result.data?.id || 'Unknown';
            
            logger.info('Call/allocation created successfully', { 
                callRef: callRef, 
                codeType: codeType 
            });

            const responseMessage = codeType === 'stock' ? 
                'Inventory allocation created and submitted successfully' :
                'Call created and submitted successfully';

            res.json({
                success: true,
                message: responseMessage,
                callRef: callRef,
                data: result.data,
                timestamp: new Date().toISOString()
            });

        } else {
            logger.error('API call returned unsuccessful result', result);
            res.status(500).json({
                success: false,
                error: 'Failed to create call/allocation',
                details: result.error || 'Unknown error occurred'
            });
        }

    } catch (error) {
        logger.error('Call creation failed', error);
        const errorResponse = handleApiError(error, 'create call/allocation');
        res.status(500).json(errorResponse);
    }
});

app.get('/api/call/:ref', async (req, res) => {
    try {
        const callRef = req.params.ref;
        logger.info('Call details request received', { callRef: callRef });

        const result = await makeApiCall(`/call/${callRef}`, 'GET');

        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Call not found',
                callRef: callRef
            });
        }

    } catch (error) {
        logger.error('Get call details failed', error, { callRef: req.params.ref });
        const errorResponse = handleApiError(error, 'get call details');
        res.status(error.response?.status || 500).json(errorResponse);
    }
});

app.get('/api/calls', async (req, res) => {
    try {
        const { status, category, priority, limit = 50, offset = 0 } = req.query;
        
        logger.info('Call search request received', { 
            status: status, 
            category: category, 
            priority: priority, 
            limit: limit, 
            offset: offset 
        });

        const queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        if (category) queryParams.append('category', category);
        if (priority) queryParams.append('priority', priority);
        queryParams.append('limit', limit);
        queryParams.append('offset', offset);

        const endpoint = `/call?${queryParams.toString()}`;
        const result = await makeApiCall(endpoint, 'GET');

        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                },
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to search calls'
            });
        }

    } catch (error) {
        logger.error('Call search failed', error);
        const errorResponse = handleApiError(error, 'search calls');
        res.status(500).json(errorResponse);
    }
});

app.post('/api/logout', (req, res) => {
    try {
        logger.info('Logout request received');
        
        tokenCache.del('access_token');
        
        res.json({
            success: true,
            message: 'Logged out successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Logout failed', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
    logger.warn('404 - Route not found', { 
        method: req.method, 
        url: req.url, 
        ip: req.ip 
    });
    
    res.status(404).json({
        success: false,
        error: 'Route not found',
        method: req.method,
        path: req.path
    });
});

app.use((error, req, res, next) => {
    logger.error('Unhandled application error', error, {
        method: req.method,
        url: req.url,
        ip: req.ip
    });

    res.status(500).json({
        success: false,
        error: config.server.nodeEnv === 'development' ? 
            error.message : 
            'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
        logger.info('HTTP server closed');
        tokenCache.close();
        process.exit(0);
    });

    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

const server = app.listen(PORT, '0.0.0.0', async () => {
    logger.info(`Server started successfully`, {
        port: PORT,
        environment: config.server.nodeEnv,
        nodeVersion: process.version,
        pid: process.pid
    });

    try {
        await getAccessToken();
        logger.info('Token cache pre-warmed successfully');
    } catch (error) {
        logger.warn('Failed to pre-warm token cache', error);
    }
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', reason, { promise: promise });
    process.exit(1);
});

module.exports = app;