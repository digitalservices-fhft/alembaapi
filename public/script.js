let accessToken = '';

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

$(document).ready(function () {
  // Set board title from URL parameter
  const boardTitle = getQueryParam('title');
  if (boardTitle) {
    $('h1.mb-4').text(boardTitle);
  }

  // Get token on page load
  $.get('/get-token', function (data) {
    accessToken = data.access_token;
    $('#callApiBtn').show();
  }).fail(function (xhr) {
    $('#responseOutput').text('Failed to retrieve token: ' + xhr.responseText);
  });

  // Trigger API call on button click
  $('#callApiBtn').click(function () {
    // Get parameters from URL or use defaults
    const receivingGroup = getQueryParam('ReceivingGroup') || 13;
    const customString1 = getQueryParam('CustomString1') || "Big Board ED Hub - Frimley";
    const configurationItemId = getQueryParam('ConfigurationItemId') || 5430;

    // Optionally, update payload with these values
    const payload = {
      "Description": "Logged Via Chris & Jon's Magic Api",
      "DescriptionHtml": "<p>Logged Via Chris & Jon's Magic Api</p>",
      "IpkStatus": 1,
      "IpkStream": 0,
      "Location": 23427,
      "Impact": 1,
      "Urgency": 4,
      "ReceivingGroup": parseInt(receivingGroup, 10),
      "Type": 149,
      "CustomString1": customString1,
      "ConfigurationItemId": parseInt(configurationItemId, 10),
      "User": 34419
    };

    // Build query string for AJAX URL
    const queryParams = $.param({
      ReceivingGroup: receivingGroup,
      CustomString1: customString1,
      ConfigurationItemId: configurationItemId
    });

    $.ajax({
      url: '/make-call?' + queryParams,
      method: 'POST',
      contentType: 'application/json',
       JSON.stringify(payload),
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
