// Utility: Get param value from query string, with a default if missing
function getParam(param, defaultValue = null) {
    const params = new URLSearchParams(window.location.search);
    return params.has(param) ? params.get(param) : defaultValue;
}

// Handles all initial UI logic and AJAX token fetching
function initializeApp() {
    let accessToken = '';
    const $btn = $('#callApiBtn');
    const $response = $('#responseOutput');
    $response.hide();
    $btn.hide();

    // Token fetch for all API requests
    $.ajax({
        url: '/get-token',
        method: 'GET',
        cache: true,
        success: function (data) {
            accessToken = data.access_token;
            $btn.show();
            $response.text('');
        },
        error: function (xhr) {
            $response.text('Failed to retrieve token: ' + xhr.responseText);
        }
    });

    setupUI();

    // Button main click: collects form, sends AJAX depending on mode
    $btn.click(handleButtonClick);
}

// Modular: Sets the UI up per codeType
function setupUI() {
    const codeType = getParam('codeType', 'call');
    const boardTitle = getParam('title');
    if (boardTitle) {
        $('h1.mb-4').text(boardTitle);
    }

    if (codeType === 'call') {
        $('#callApiBtn').text('Let us know!');
        $('#infFields').hide();
        $('#stockFields').hide();
    } else if (codeType === 'stock') {
        $('#callApiBtn').text('Update stock');
        $('#stockFields').show();
        $('#infFields').hide();
    } else if (codeType === 'inf') {
        $('#callApiBtn').text('Submit');
        $('#infFields').show();
        $('#stockFields').hide();
    } else {
        $('#callApiBtn').text('Submit');
        $('#infFields').hide();
        $('#stockFields').hide();
    }
}

// Main form submit handler (modular and reusable)
function handleButtonClick() {
    const codeType = getParam('codeType', 'call');
    const $response = $('#responseOutput');
    const $btn = $('#callApiBtn');
    $response.hide();

    if (codeType === 'inf') {
        // Info mode: collect description, optional file, params from query
        const description = $('#descriptionInput').val();
        const imageFile = $('#imageInput')[0].files[0];
        const urlParams = new URLSearchParams(window.location.search);
        let ajaxUrl = '/make-call';
        if (urlParams.toString()) {
            ajaxUrl += '?' + urlParams.toString();
        }
        if (!description) {
            $response.text('Description is required.');
            $response.show();
            return;
        }
        const formData = new FormData();
        formData.append('description', description);
        if (imageFile) formData.append('attachment', imageFile);

        $.ajax({
            url: ajaxUrl,
            method: 'POST',
            processData: false,
            contentType: false,
             formData,
            success: function (response) {
                $response.show();
                if (response.callRef) {
                    $btn.hide();
                    $response.html(`<div>Call submitted, ref: <b>${response.callRef}</b></div>`);
                } else {
                    $response.text('Call submitted.');
                }
            },
            error: function (xhr) {
                $response.show();
                $response.text('Submission error: ' + xhr.responseText);
            }
        });

    } else if (codeType === 'stock') {
        // Stock mode: handle stock form submission (to be implemented as needed)
        $response.text('Stock mode submission not yet implemented.');
        $response.show();
    } else {
        // Default mode
        $response.text('Default submission not yet implemented.');
        $response.show();
    }
}

// DOM-ready initialization
$(document).ready(initializeApp);