let accessToken = '';

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

$(document).ready(function() {
  const boardTitle = getQueryParam('title');
  if (boardTitle) {
    $('h1.mb-4').text(boardTitle);
  }
});

  // Trigger API call on button click
  $('#callApiBtn').click(function () {
    const payload = {
      "Description": "Logged Via Chris & Jon's Magic Api",
      "DescriptionHtml": "<p>Logged Via Chris & Jon's Magic Api</p>",
      "IpkStatus": 1,
      "IpkStream": 0,
      "Location": 23427,
      "Impact": 1,
      "Urgency": 4,
      "ReceivingGroup": 13,
      "Type": 149,
      "CustomString1": "Big Board ED Hub - Frimley",
      "ConfigurationItemId": 5430,
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
