$(document).ready(function () {
  // Get token on page load
  $.get('/get-token', function (data) {
    accessToken = data.access_token;
    $('#callApiBtn').show();
  }).fail(function (xhr) {
    $('#responseOutput').text('Failed to retrieve token: ' + xhr.responseText);
  });

  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Set heading if title param exists
  const boardTitle = getQueryParam('title');
  if (boardTitle) {
    $('h1.mb-4').text(boardTitle);
  }

  // Get required parameters from URL with defaults
const receivingGroup = getQueryParam('receivingGroup') || 13;
const customString1 = getQueryParam('customString1') || "Big Board ED Hub - Frimley";
const configurationItemId = getQueryParam('configurationItemId') || 5430;
const type = getQueryParam('type') || 143;
const description = getQueryParam('description') || "Ticket logged via API";

  // Trigger API call on button click
  $('#callApiBtn').click(function () {
    const payload = {
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