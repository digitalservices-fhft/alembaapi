// public/script.js
$(function () {
  // Show loading indicator immediately
  $('#responseOutput').text('Loading authentication token...');

  // Use URLSearchParams for robust query string parsing
  const params = new URLSearchParams(window.location.search);

  function getParam(param, defaultValue = null) {
    return params.has(param) ? params.get(param) : defaultValue;
  }

  // Set heading if title param exists
  const boardTitle = getParam('title');
  if (boardTitle) {
    $('h1.mb-4').text(boardTitle);
  }

  // Get parameters for payload
  const receivingGroup = getParam('receivingGroup');
  const customString1 = getParam('customString1');
  const configurationItemId = getParam('configurationItemId');
  const type = getParam('type');
  const description = getParam('description');
  const impact = parseInt(getParam('impact'));
  const urgency = parseInt(getParam('urgency'));

  let accessToken = '';

  // Hide the call button until token is retrieved
  $('#callApiBtn').hide();

  // Get token as soon as possible
  $.ajax({
    url: '/get-token',
    method: 'GET',
    cache: true,
    success: function (data) {
      accessToken = data.access_token;
      $('#callApiBtn').show();
      $('#responseOutput').text('');
    },
    error: function (xhr) {
      $('#responseOutput').text('Failed to retrieve token: ' + xhr.responseText);
    }
  });

  // Trigger API call on button click
  $('#callApiBtn').click(function () {
    // Validate parameters
    if (!receivingGroup || !customString1 || !configurationItemId || !type || !description) {
      $('#responseOutput').text('Missing required parameters. Please provide receivingGroup, customString1, configurationItemId, type, and description.');
      return;
    }

    const payload = {
      receivingGroup,
      customString1,
      configurationItemId,
      type,
      description,
      impact,
      urgency
    };

    $.ajax({
      url: '/make-call',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function (response) {
        if (response.callRef) {
          $('#callApiBtn').hide();
          $('#responseOutput').html(
            '<div class="alert alert-success"><center>Call created and submitted successfully. Reference: <b>' +
              response.callRef +
              '</b></center></div>'
          );
        } else {
          $('#responseOutput').text('API call succeeded but no call reference returned.');
        }
      },
      error: function (xhr) {
        let errorMsg = 'API call failed.';
        if (xhr.responseText) {
          errorMsg += ' ' + xhr.responseText;
        }
        $('#responseOutput').text(errorMsg);
      }
    });
  });
});