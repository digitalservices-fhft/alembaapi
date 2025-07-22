// script.js - Complete client-side application with Axios and best practices
(function(window, document) {
    'use strict';

    // ============================================================================
    // CONFIGURATION AND CONSTANTS
    // ============================================================================

    const CONFIG = {
        api: {
            baseURL: window.location.origin,
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000
        },
        ui: {
            fadeSpeed: 300,
            debounceDelay: 500,
            toastDuration: 5000
        },
        validation: {
            minDescriptionLength: 5,
            maxDescriptionLength: 500,
            minQuantity: 1,
            maxQuantity: 10000
        }
    };

    // ============================================================================
    // AXIOS CONFIGURATION AND SETUP
    // ============================================================================

    // Create Axios instance for API calls
    const apiClient = axios.create({
        baseURL: CONFIG.api.baseURL,
        timeout: CONFIG.api.timeout,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    // ============================================================================
    // UTILITY MODULES
    // ============================================================================

    /**
     * Utility functions module
     */
    const Utils = (function() {
        
        /**
         * Debounce function to limit function calls
         */
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        /**
         * Sleep utility for delays
         */
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /**
         * Generate unique ID
         */
        function generateId() {
            return '_' + Math.random().toString(36).substr(2, 9);
        }

        /**
         * Format timestamp for display
         */
        function formatTimestamp(timestamp) {
            return new Date(timestamp).toLocaleString();
        }

        /**
         * Sanitize HTML to prevent XSS
         */
        function sanitizeHTML(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        /**
         * Validate email format
         */
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        return {
            debounce,
            sleep,
            generateId,
            formatTimestamp,
            sanitizeHTML,
            isValidEmail
        };
    })();

    /**
     * Local storage management module
     */
    const Storage = (function() {
        
        function set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn('Failed to save to localStorage:', error);
                return false;
            }
        }

        function get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (error) {
                console.warn('Failed to read from localStorage:', error);
                return null;
            }
        }

        function remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.warn('Failed to remove from localStorage:', error);
                return false;
            }
        }

        function clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.warn('Failed to clear localStorage:', error);
                return false;
            }
        }

        return { set, get, remove, clear };
    })();

    // ============================================================================
    // API SERVICE MODULE
    // ============================================================================

    /**
     * API service module for all server communication
     */
    const ApiService = (function() {
        let accessToken = null;
        let tokenRefreshPromise = null;
        let requestQueue = [];

        /**
         * Set up request interceptor
         */
        apiClient.interceptors.request.use(
            (config) => {
                if (accessToken) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        /**
         * Set up response interceptor for token refresh
         */
        apiClient.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        await refreshToken();
                        return apiClient(originalRequest);
                    } catch (refreshError) {
                        Logger.error('Token refresh failed', refreshError);
                        // Redirect to login or show authentication error
                        UIManager.showNotification('Session expired. Please refresh the page.', 'error');
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );

        /**
         * Refresh access token
         */
        async function refreshToken() {
            if (tokenRefreshPromise) {
                return tokenRefreshPromise;
            }

            tokenRefreshPromise = getAccessToken();
            
            try {
                const token = await tokenRefreshPromise;
                accessToken = token;
                return token;
            } finally {
                tokenRefreshPromise = null;
            }
        }

        /**
         * Get access token from server
         */
        async function getAccessToken() {
            try {
                Logger.info('Requesting access token');
                const response = await apiClient.get('/api/get-token');
                
                if (response.data.success && response.data.access_token) {
                    accessToken = response.data.access_token;
                    Logger.info('Access token obtained successfully');
                    return accessToken;
                } else {
                    throw new Error('Invalid token response');
                }
            } catch (error) {
                Logger.error('Failed to get access token', error);
                throw new Error('Authentication failed');
            }
        }

        /**
         * Make API call with retry logic
         */
        async function makeApiCall(method, url, data = null, options = {}) {
            const maxRetries = options.retries || CONFIG.api.retryAttempts;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    Logger.info(`Making API call: ${method.toUpperCase()} ${url} (attempt ${attempt})`);
                    
                    const config = {
                        method: method.toLowerCase(),
                        url,
                        ...options
                    };

                    if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
                        config.data = data;
                    }

                    const response = await apiClient(config);
                    
                    Logger.info(`API call successful: ${method.toUpperCase()} ${url}`);
                    return {
                        success: true,
                         response.data,
                        status: response.status,
                        headers: response.headers
                    };

                } catch (error) {
                    Logger.warn(`API call attempt ${attempt} failed: ${method.toUpperCase()} ${url}`, error);

                    // Don't retry on client errors (except 401, 429)
                    if (error.response?.status >= 400 && 
                        error.response?.status < 500 && 
                        ![401, 429].includes(error.response.status)) {
                        throw error;
                    }

                    if (attempt === maxRetries) {
                        throw error;
                    }

                    // Exponential backoff with jitter
                    const delay = CONFIG.api.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
                    Logger.info(`Retrying in ${Math.round(delay)}ms...`);
                    await Utils.sleep(delay);
                }
            }
        }

        /**
         * Create call or inventory allocation
         */
        async function createCall(callData) {
            try {
                const result = await makeApiCall('POST', '/api/make-call', callData);
                return result;
            } catch (error) {
                throw ErrorHandler.formatApiError(error, 'create call');
            }
        }

        /**
         * Get call details
         */
        async function getCall(callRef) {
            try {
                const result = await makeApiCall('GET', `/api/call/${callRef}`);
                return result;
            } catch (error) {
                throw ErrorHandler.formatApiError(error, 'get call details');
            }
        }

        /**
         * Search calls
         */
        async function searchCalls(params = {}) {
            try {
                const queryString = new URLSearchParams(params).toString();
                const url = `/api/calls${queryString ? '?' + queryString : ''}`;
                const result = await makeApiCall('GET', url);
                return result;
            } catch (error) {
                throw ErrorHandler.formatApiError(error, 'search calls');
            }
        }

        /**
         * Health check
         */
        async function healthCheck() {
            try {
                const result = await makeApiCall('GET', '/health');
                return result;
            } catch (error) {
                throw ErrorHandler.formatApiError(error, 'health check');
            }
        }

        /**
         * Logout
         */
        async function logout() {
            try {
                await makeApiCall('POST', '/api/logout');
                accessToken = null;
                Storage.clear();
            } catch (error) {
                Logger.warn('Logout request failed, clearing local data anyway', error);
                accessToken = null;
                Storage.clear();
            }
        }

        return {
            getAccessToken,
            createCall,
            getCall,
            searchCalls,
            healthCheck,
            logout
        };
    })();

    // ============================================================================
    // ERROR HANDLING MODULE
    // ============================================================================

    /**
     * Centralized error handling module
     */
    const ErrorHandler = (function() {
        
        /**
         * Format API errors for user display
         */
        function formatApiError(error, operation = 'operation') {
            const formattedError = {
                message: 'An error occurred',
                operation,
                timestamp: new Date().toISOString(),
                type: 'unknown'
            };

            if (error.response) {
                const status = error.response.status;
                formattedError.status = status;
                formattedError.type = 'api_error';

                switch (status) {
                    case 400:
                        formattedError.message = 'Invalid request data. Please check your input.';
                        break;
                    case 401:
                        formattedError.message = 'Authentication required. Please refresh the page.';
                        break;
                    case 403:
                        formattedError.message = 'Access denied. You don\'t have permission for this action.';
                        break;
                    case 404:
                        formattedError.message = 'The requested resource was not found.';
                        break;
                    case 429:
                        formattedError.message = 'Too many requests. Please wait and try again.';
                        break;
                    case 500:
                        formattedError.message = 'Server error. Please try again later.';
                        break;
                    default:
                        formattedError.message = `Server error (${status}). Please try again.`;
                }

                if (error.response.data?.error) {
                    formattedError.details = error.response.data.error;
                }

            } else if (error.request) {
                formattedError.type = 'network_error';
                if (error.code === 'ECONNABORTED') {
                    formattedError.message = 'Request timeout. Please check your connection and try again.';
                } else {
                    formattedError.message = 'Network error. Please check your internet connection.';
                }
            } else {
                formattedError.type = 'client_error';
                formattedError.message = error.message || 'An unexpected error occurred.';
            }

            Logger.error(`Error during ${operation}:`, formattedError);
            return formattedError;
        }

        /**
         * Handle validation errors
         */
        function handleValidationError(errors) {
            return {
                type: 'validation_error',
                message: 'Please correct the following errors:',
                errors: errors,
                timestamp: new Date().toISOString()
            };
        }

        return {
            formatApiError,
            handleValidationError
        };
    })();

    // ============================================================================
    // LOGGING MODULE
    // ============================================================================

    /**
     * Logging module with different levels
     */
    const Logger = (function() {
        const LOG_LEVELS = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };

        let currentLevel = LOG_LEVELS.INFO;

        function setLevel(level) {
            currentLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
        }

        function log(level, message, data = null) {
            if (LOG_LEVELS[level] <= currentLevel) {
                const timestamp = new Date().toISOString();
                const logMessage = `[${timestamp}] [${level}] ${message}`;
                
                switch (level) {
                    case 'ERROR':
                        console.error(logMessage, data);
                        break;
                    case 'WARN':
                        console.warn(logMessage, data);
                        break;
                    case 'INFO':
                        console.log(logMessage, data);
                        break;
                    case 'DEBUG':
                        console.debug(logMessage, data);
                        break;
                }
            }
        }

        return {
            setLevel,
            error: (message, data) => log('ERROR', message, data),
            warn: (message, data) => log('WARN', message, data),
            info: (message, data) => log('INFO', message, data),
            debug: (message, data) => log('DEBUG', message, data)
        };
    })();

    // ============================================================================
    // VALIDATION MODULE
    // ============================================================================

    /**
     * Form validation module
     */
    const Validator = (function() {
        
        /**
         * Validate call creation form
         */
        function validateCallForm(formData) {
            const errors = [];

            // Validate codeType
            if (!formData.codeType || !['call', 'stock'].includes(formData.codeType)) {
                errors.push({
                    field: 'codeType',
                    message: 'Please select either "Service Call" or "Stock Allocation"'
                });
            }

            // Validate description
            if (!formData.description || formData.description.trim().length === 0) {
                errors.push({
                    field: 'description',
                    message: 'Description is required'
                });
            } else if (formData.description.trim().length < CONFIG.validation.minDescriptionLength) {
                errors.push({
                    field: 'description',
                    message: `Description must be at least ${CONFIG.validation.minDescriptionLength} characters`
                });
            } else if (formData.description.length > CONFIG.validation.maxDescriptionLength) {
                errors.push({
                    field: 'description',
                    message: `Description must be less than ${CONFIG.validation.maxDescriptionLength} characters`
                });
            }

            // Validate stock-specific fields
            if (formData.codeType === 'stock') {
                if (formData.quantity && (!Number.isInteger(+formData.quantity) || +formData.quantity < CONFIG.validation.minQuantity)) {
                    errors.push({
                        field: 'quantity',
                        message: `Quantity must be at least ${CONFIG.validation.minQuantity}`
                    });
                }

                if (formData.quantity && +formData.quantity > CONFIG.validation.maxQuantity) {
                    errors.push({
                        field: 'quantity',
                        message: `Quantity cannot exceed ${CONFIG.validation.maxQuantity}`
                    });
                }
            }

            return errors;
        }

        /**
         * Validate search form
         */
        function validateSearchForm(formData) {
            const errors = [];

            if (formData.callRef && formData.callRef.trim().length === 0) {
                errors.push({
                    field: 'callRef',
                    message: 'Call reference cannot be empty'
                });
            }

            return errors;
        }

        return {
            validateCallForm,
            validateSearchForm
        };
    })();

    // ============================================================================
    // UI MANAGEMENT MODULE
    // ============================================================================

    /**
     * UI management and interaction module
     */
    const UIManager = (function() {
        let notificationTimeout;

        /**
         * Show loading state
         */
        function showLoading(element, text = 'Loading...') {
            const originalText = element.textContent;
            element.disabled = true;
            element.textContent = text;
            element.classList.add('loading');
            
            return function hideLoading() {
                element.disabled = false;
                element.textContent = originalText;
                element.classList.remove('loading');
            };
        }

        /**
         * Show notification message
         */
        function showNotification(message, type = 'info', duration = CONFIG.ui.toastDuration) {
            clearTimeout(notificationTimeout);

            const notification = document.getElementById('notification');
            const notificationMessage = document.getElementById('notification-message');
            
            if (!notification || !notificationMessage) {
                console.warn('Notification elements not found, falling back to alert');
                alert(message);
                return;
            }

            // Remove existing type classes
            notification.classList.remove('notification-success', 'notification-error', 'notification-warning', 'notification-info');
            
            // Add appropriate class
            notification.classList.add(`notification-${type}`);
            
            notificationMessage.textContent = message;
            notification.style.display = 'block';
            
            // Auto-hide after duration
            notificationTimeout = setTimeout(() => {
                hideNotification();
            }, duration);
        }

        /**
         * Hide notification
         */
        function hideNotification() {
            const notification = document.getElementById('notification');
            if (notification) {
                notification.style.display = 'none';
            }
        }

        /**
         * Update form visibility based on code type
         */
        function updateFormVisibility(codeType) {
            const stockFields = document.getElementById('stock-fields');
            
            if (stockFields) {
                stockFields.style.display = codeType === 'stock' ? 'block' : 'none';
            }
        }

        /**
         * Display validation errors
         */
        function displayValidationErrors(errors) {
            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(error => {
                error.remove();
            });
            
            document.querySelectorAll('.error').forEach(field => {
                field.classList.remove('error');
            });

            // Display new errors
            errors.forEach(error => {
                const field = document.getElementById(error.field);
                if (field) {
                    field.classList.add('error');
                    
                    const errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    errorElement.textContent = error.message;
                    
                    field.parentNode.insertBefore(errorElement, field.nextSibling);
                }
            });

            // Focus on first error field
            if (errors.length > 0) {
                const firstErrorField = document.getElementById(errors[0].field);
                if (firstErrorField) {
                    firstErrorField.focus();
                }
            }
        }

        /**
         * Clear form
         */
        function clearForm(formId) {
            const form = document.getElementById(formId);
            if (form) {
                form.reset();
                
                // Clear errors
                document.querySelectorAll('.error-message').forEach(error => {
                    error.remove();
                });
                
                document.querySelectorAll('.error').forEach(field => {
                    field.classList.remove('error');
                });

                // Hide stock fields if needed
                updateFormVisibility('call');
            }
        }

        /**
         * Update results display
         */
        function updateResults(data, type = 'call') {
            const resultsDiv = document.getElementById('results');
            if (!resultsDiv) return;

            if (data) {
                const sanitizedData = Utils.sanitizeHTML(JSON.stringify(data, null, 2));
                resultsDiv.innerHTML = `
                    <h3>Result:</h3>
                    <div class="result-success">
                        <strong>Success!</strong> ${type === 'call' ? 'Call' : 'Request'} processed successfully.
                        ${data.callRef ? `<br><strong>Reference:</strong> ${Utils.sanitizeHTML(data.callRef)}` : ''}
                        ${data.message ? `<br><strong>Message:</strong> ${Utils.sanitizeHTML(data.message)}` : ''}
                    </div>
                    <details>
                        <summary>View Full Response</summary>
                        <pre>${sanitizedData}</pre>
                    </details>
                `;
            } else {
                resultsDiv.innerHTML = '';
            }
        }

        /**
         * Update call search results
         */
        function updateCallSearchResults(calls) {
            const resultsDiv = document.getElementById('search-results');
            if (!resultsDiv) return;

            if (calls && calls.length > 0) {
                let html = '<h3>Search Results:</h3><div class="calls-list">';
                
                calls.forEach(call => {
                    html += `
                        <div class="call-item">
                            <strong>Ref:</strong> ${Utils.sanitizeHTML(call.ref || 'N/A')} |
                            <strong>Status:</strong> ${Utils.sanitizeHTML(call.status || 'N/A')} |
                            <strong>Created:</strong> ${call.created ? Utils.formatTimestamp(call.created) : 'N/A'}
                            ${call.shortDescription ? `<br><em>${Utils.sanitizeHTML(call.shortDescription)}</em>` : ''}
                        </div>
                    `;
                });
                
                html += '</div>';
                resultsDiv.innerHTML = html;
            } else {
                resultsDiv.innerHTML = '<div class="no-results">No calls found.</div>';
            }
        }

        return {
            showLoading,
            showNotification,
            hideNotification,
            updateFormVisibility,
            displayValidationErrors,
            clearForm,
            updateResults,
            updateCallSearchResults
        };
    })();

    // ============================================================================
    // MAIN APPLICATION MODULE
    // ============================================================================

    /**
     * Main application module
     */
    const App = (function() {
        let isInitialized = false;

        /**
         * Initialize the application
         */
        async function init() {
            if (isInitialized) return;
            
            try {
                Logger.info('Initializing application...');
                
                // Set up event listeners
                setupEventListeners();
                
                // Initialize Axios
                await initializeAxios();
                
                // Perform health check
                await performHealthCheck();
                
                isInitialized = true;
                Logger.info('Application initialized successfully');
                
            } catch (error) {
                Logger.error('Failed to initialize application', error);
                UIManager.showNotification('Failed to initialize application. Please refresh the page.', 'error');
            }
        }

        /**
         * Initialize Axios and get initial token
         */
        async function initializeAxios() {
            try {
                await ApiService.getAccessToken();
                Logger.info('Axios initialized with access token');
            } catch (error) {
                Logger.warn('Failed to get initial access token', error);
                // Don't throw error - token will be requested when needed
            }
        }

        /**
         * Perform health check
         */
        async function performHealthCheck() {
            try {
                const result = await ApiService.healthCheck();
                if (result.success) {
                    Logger.info('Health check passed', result.data);
                }
            } catch (error) {
                Logger.warn('Health check failed', error);
                UIManager.showNotification('Server connectivity issues detected.', 'warning');
            }
        }

        /**
         * Set up all event listeners
         */
        function setupEventListeners() {
            // Main call form submission
            const callForm = document.getElementById('call-form');
            if (callForm) {
                callForm.addEventListener('submit', handleCallFormSubmit);
            }

            // Code type change handler
            const codeTypeField = document.getElementById('codeType');
            if (codeTypeField) {
                codeTypeField.addEventListener('change', (e) => {
                    UIManager.updateFormVisibility(e.target.value);
                });
            }

            // Search form submission
            const searchForm = document.getElementById('search-form');
            if (searchForm) {
                searchForm.addEventListener('submit', handleSearchFormSubmit);
            }

            // Clear forms buttons
            const clearCallFormBtn = document.getElementById('clear-call-form');
            if (clearCallFormBtn) {
                clearCallFormBtn.addEventListener('click', () => {
                    UIManager.clearForm('call-form');
                    UIManager.updateResults(null);
                });
            }

            const clearSearchFormBtn = document.getElementById('clear-search-form');
            if (clearSearchFormBtn) {
                clearSearchFormBtn.addEventListener('click', () => {
                    UIManager.clearForm('search-form');
                    UIManager.updateCallSearchResults([]);
                });
            }

            // Notification close button
            const notificationClose = document.getElementById('notification-close');
            if (notificationClose) {
                notificationClose.addEventListener('click', UIManager.hideNotification);
            }

            // Global error handler
            window.addEventListener('error', (event) => {
                Logger.error('Uncaught error:', event.error);
                UIManager.showNotification('An unexpected error occurred.', 'error');
            });

            // Unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (event) => {
                Logger.error('Unhandled promise rejection:', event.reason);
                UIManager.showNotification('An unexpected error occurred.', 'error');
                event.preventDefault();
            });

            Logger.info('Event listeners set up successfully');
        }

        /**
         * Handle call form submission
         */
        async function handleCallFormSubmit(event) {
            event.preventDefault();
            
            const submitButton = event.target.querySelector('button[type="submit"]');
            const hideLoading = UIManager.showLoading(submitButton, 'Creating...');

            try {
                // Get form data
                const formData = new FormData(event.target);
                const callData = {
                    codeType: formData.get('codeType'),
                    description: formData.get('description'),
                    purchase: formData.get('purchase'),
                    quantity: formData.get('quantity'),
                    transactionStatus: formData.get('transactionStatus')
                };

                Logger.info('Processing call form submission', callData);

                // Validate form data
                const validationErrors = Validator.validateCallForm(callData);
                if (validationErrors.length > 0) {
                    UIManager.displayValidationErrors(validationErrors);
                    UIManager.showNotification('Please correct the form errors.', 'warning');
                    return;
                }

                // Submit to API
                const result = await ApiService.createCall(callData);

                if (result.success) {
                    UIManager.showNotification(
                        result.data.message || `${callData.codeType === 'stock' ? 'Stock allocation' : 'Call'} created successfully!`, 
                        'success'
                    );
                    UIManager.updateResults(result.data, callData.codeType);
                    UIManager.clearForm('call-form');
                } else {
                    throw new Error('API call was not successful');
                }

            } catch (error) {
                const formattedError = ErrorHandler.formatApiError(error, 'create call');
                UIManager.showNotification(formattedError.message, 'error');
                Logger.error('Call form submission failed', formattedError);
            } finally {
                hideLoading();
            }
        }

        /**
         * Handle search form submission
         */
        async function handleSearchFormSubmit(event) {
            event.preventDefault();
            
            const submitButton = event.target.querySelector('button[type="submit"]');
            const hideLoading = UIManager.showLoading(submitButton, 'Searching...');

            try {
                const formData = new FormData(event.target);
                const searchData = {
                    callRef: formData.get('callRef'),
                    status: formData.get('status'),
                    category: formData.get('category'),
                    priority: formData.get('priority')
                };

                Logger.info('Processing search form submission', searchData);

                // Validate search data
                const validationErrors = Validator.validateSearchForm(searchData);
                if (validationErrors.length > 0) {
                    UIManager.displayValidationErrors(validationErrors);
                    UIManager.showNotification('Please correct the search criteria.', 'warning');
                    return;
                }

                // If specific call reference provided, get that call
                if (searchData.callRef && searchData.callRef.trim()) {
                    const result = await ApiService.getCall(searchData.callRef.trim());
                    
                    if (result.success) {
                        UIManager.updateCallSearchResults([result.data]);
                        UIManager.showNotification('Call found successfully!', 'success');
                    }
                } else {
                    // General search
                    const searchParams = {};
                    if (searchData.status) searchParams.status = searchData.status;
                    if (searchData.category) searchParams.category = searchData.category;
                    if (searchData.priority) searchParams.priority = searchData.priority;

                    const result = await ApiService.searchCalls(searchParams);
                    
                    if (result.success) {
                        const calls = Array.isArray(result.data) ? result.data : result.data.calls || [];
                        UIManager.updateCallSearchResults(calls);
                        UIManager.showNotification(`Found ${calls.length} call(s)`, 'success');
                    }
                }

            } catch (error) {
                const formattedError = ErrorHandler.formatApiError(error, 'search calls');
                UIManager.showNotification(formattedError.message, 'error');
                UIManager.updateCallSearchResults([]);
                Logger.error('Search form submission failed', formattedError);
            } finally {
                hideLoading();
            }
        }

        return {
            init
        };
    })();

    // ============================================================================
    // APPLICATION INITIALIZATION
    // ============================================================================

    // Initialize application when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', App.init);
    } else {
        // DOM is already ready
        App.init();
    }

    // Expose public API for debugging and external access
    window.CallApp = {
        Utils,
        ApiService,
        UIManager,
        Logger,
        Validator,
        Storage,
        version: '2.0.0'
    };

    Logger.info('Call Management Application script loaded successfully');

})(window, document);