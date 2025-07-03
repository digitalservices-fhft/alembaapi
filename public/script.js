$(document).ready(function () {
  // Use URLSearchParams best practice
  const params = new URLSearchParams(window.location.search);

  function getParam(param, defaultValue) {
    return params.has(param) ? params.get(param) : defaultValue;
  }

  // Set heading if title param exists
  const boardTitle = getParam('title', null);
  if (boardTitle) {
    $('h1.mb-4').text(boardTitle);
  }

  // Get parameters for payload
  const receivingGroup = getParam('receivingGroup');
  const customString1 = getParam('customString1');
  const configurationItemId = getParam('configurationItemId');
  const type = getParam('type');
  const description = getParam('description'); // <-- NEW

  // Get token on page load
  let accessToken = '';
  $.get('/get-token', function (data) {
    accessToken = data.access_token;
    $('#callApiBtn').show();
  }).fail(function (xhr) {
    $('#responseOutput').text('Failed to retrieve token: ' + xhr.responseText);
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
      description // <-- Pass to server
    };

    console.log('Submitting payload:', payload);

    $.ajax({
      url: '/make-call',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function (response) {
        if (response.callRef) {
          $('#callApiBtn').hide();
          $('#responseOutput').html(
            '<div class="alert alert-success">Call created and submitted successfully. Reference: <b>' +
              response.callRef +
              '</b></div>'
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
