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
  const detail = getParam('detail');

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
    // Optional: Validate parameters
    if (!receivingGroup || !customString1 || !configurationItemId || !type || !detail) {
      $('#responseOutput').text('Missing required parameters. Please provide receivingGroup, customString1, configurationItemId, type, and detail.');
      return;
    }

    const payload = {
      "Description": title,
      "DescriptionHtml": `<p>${title}</p>`,
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

    $.ajax({
      url: '/make-call',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function (response) {
        if (response.callRef) {
          $('#callApiBtn').hide();
          $('#responseOutput').html(
            '<div class="alert alert-success" role="alert">' +
            'Thank you for logging - Your reference number is <strong>' + response.callRef + '</strong>.' +
            '</div>'
          );
        } else {
          $('#responseOutput').text('Call submitted but no reference number returned.');
        }
      },
      error: function (xhr) {
        $('#responseOutput').text('Error: ' + xhr.responseText);
      }
    });
  });
});