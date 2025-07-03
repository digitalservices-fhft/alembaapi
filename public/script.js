$(document).ready(function () {
  // Helper: Get query parameter by name
  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Helper: Set a cookie
  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
  }

  // Helper: Get a cookie
  function getCookie(name) {
    let cname = name + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(cname) === 0) {
        return c.substring(cname.length, c.length);
      }
    }
    return "";
  }

  // Store parameters from URL into cookies if present
  const paramsToStore = ['receivingGroup', 'customString1', 'configurationItemId', 'type', 'description'];
  paramsToStore.forEach(function(param) {
    const value = getQueryParam(param);
    if (value !== null) {
      setCookie(param, value, 1); // Store for 1 day
    }
  });

  // Get value from URL, then cookie, then default
  function getParamFromUrlOrCookie(param, defaultValue) {
    const urlValue = getQueryParam(param);
    if (urlValue !== null) return urlValue;
    const cookieValue = getCookie(param);
    if (cookieValue) return cookieValue;
    return defaultValue;
  }

  // Set heading if title param exists
  const boardTitle = getParamFromUrlOrCookie('title', null);
  if (boardTitle) {
    $('h1.mb-4').text(boardTitle);
  }

  // Get parameters for payload
  const receivingGroup = getParamFromUrlOrCookie('receivingGroup', 13);
  const customString1 = getParamFromUrlOrCookie('customString1', "Big Board ED Hub - Frimley");
  const configurationItemId = getParamFromUrlOrCookie('configurationItemId', 5430);
  const type = getParamFromUrlOrCookie('type', 143);
  const description = getParamFromUrlOrCookie('description', "Ticket logged via API");

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
    if (!receivingGroup || !customString1 || !configurationItemId || !type || !description) {
      $('#responseOutput').text('Missing required parameters. Please provide receivingGroup, customString1, configurationItemId, type, and description.');
      return;
    }

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
