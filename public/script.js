$(document).ready(function () {
  function refreshTokenAndRetry(payload, onSuccess, onError) {
    $.ajax({
      url: '/get-token',
      method: 'GET',
      cache: true,
      success: function (data) {
        accessToken = data.access_token;
        $.ajax({
          url: '/make-call',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(payload),
          success: onSuccess,
          error: onError
        });
      },
      error: function (xhr) {
        $('#responseOutput').html(`Failed to refresh token: ${xhr.responseText}`).show();
      }
    });
  }

  const params = new URLSearchParams(window.location.search);
  function getParam(param, defaultValue = null) {
    return params.has(param) ? params.get(param) : defaultValue;
  }

  let accessToken = '';
  const $btn = $('#callApiBtn');
  $('#responseOutput').hide();
  $btn.hide();

  $.ajax({
    url: '/get-token',
    method: 'GET',
    cache: true,
    success: function (data) {
      accessToken = data.access_token;
      $btn.show();
      $('#responseOutput').text('');
    },
    error: function (xhr) {
      $('#responseOutput').text('Failed to retrieve token: ' + xhr.responseText);
    }
  });

  const boardTitle = getParam('title');
  if (boardTitle) {
    $('h1.mb-4').text(boardTitle);
  }

  const codeType = getParam('codeType', 'call');
  const receivingGroup = getParam('receivingGroup');
  const customString1 = getParam('customString1');
  const configurationItemId = getParam('configurationItemId');
  const type = getParam('type');
  const impact = getParam('impact');
  const urgency = getParam('urgency');
  const purchase = getParam('purchase');
  const transactionStatus = getParam('transactionStatus');

  if (codeType === 'call') {
    $btn.text('Let us know!');
    $('#infFields').hide();
    $('#stockFields').hide();
  } else if (codeType === 'stock') {
    $btn.text('Update stock');
    $('#stockFields').show();
    $('#infFields').hide();
  } else if (codeType === 'inf') {
    $btn.text('Submit');
    $('#infFields').show();
    $('#stockFields').hide();
  } else {
    $btn.text('Submit');
    $('#infFields').hide();
    $('#stockFields').hide();
  }

  if (codeType === "stock") {
    const imageMap = {
      smartcard: "smartcardkeyboard.png",
      docking: "dockingstation.png",
      mouse: "mouse.png",
      barcode: "scanner.png",
      keyboard: "keyboard.png",
      rover: "rover.png",
      powermic: "powermic.png",
      monitor: "monitor.png"
    };
    if (boardTitle) {
      $('#image-container').empty();
      let found = false;
      for (const keyword in imageMap) {
        if (boardTitle.toLowerCase().includes(keyword)) {
          const img = $('<img>', {
            src: `img/${imageMap[keyword]}`,
            alt: keyword,
            onerror: "this.style.display='none'",
            class: 'img-fluid d-block mx-auto'
          });
          $('#image-container').append(img);
          found = true;
          break;
        }
      }
      if (!found) {
        $('#image-container').append('\nNo matching image found.\n');
      }
    }
  }

  $btn.click(function () {
    if (codeType === 'inf') {
      const description = $('#descriptionInput').val();
      const imageFile = $('#imageInput')[0].files[0];

      if (!impact || !urgency || !customString1 || !description) {
        $('#responseOutput').text('Missing required parameters for inf: impact, urgency, customString1, or description.');
        $('#responseOutput').show();
        return;
      }

      const formData = new FormData();
      formData.append('codeType', 'inf');
      formData.append('impact', impact);
      formData.append('urgency', urgency);
      formData.append('customString1', customString1);
      formData.append('description', description);
      if (imageFile) {
        formData.append('attachment', imageFile);
      }

      $.ajax({
        url: '/make-call',
        method: 'POST',
        processData: false,
        contentType: false,
        data: formData,
        success: function (response) {
          $('#responseOutput').show();
          if (response.callRef) {
            $btn.hide();
            $('#responseOutput').html(
              '<div class="alert alert-success"><center>Call created successfully. Reference: <b>' +
              response.callRef +
              '</b></center></div>'
            );
          } else {
            $('#responseOutput').text('API call succeeded but no reference returned.');
          }
        },
        error: function (xhr) {
          $('#responseOutput').show();
          let errorMsg = 'API call failed.';
          if (xhr.responseText) {
            errorMsg += ' ' + xhr.responseText;
          }
          $('#responseOutput').text(errorMsg);
        }
      });
      return;
    }

    // Existing logic for stock and call
    if (codeType === 'stock') {
      const quantity = $('#quantityInput').val();
      if (!purchase || !transactionStatus || !quantity) {
        $('#responseOutput').text('Missing required parameters for stock: purchase, transactionStatus, or quantity.');
        $('#responseOutput').show();
        return;
      }
      const payload = {
        codeType: 'stock',
        purchase: parseInt(purchase, 10),
        transactionStatus: parseInt(transactionStatus, 10),
        quantity: parseInt(quantity, 10)
      };
      $.ajax({
        url: '/make-call',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (response) {
          $('#responseOutput').show();
          if (response.callRef) {
            $btn.hide();
            $('#responseOutput').html(
              'Stock transaction submitted successfully. Reference: <strong>' + response.callRef + '</strong>'
            );
          } else {
            $('#responseOutput').text('API call succeeded but no reference returned.');
          }
        },
        error: function (xhr) {
          $('#responseOutput').show();
          let errorMsg = 'API call failed.';
          if (xhr.responseText) {
            errorMsg += ' ' + xhr.responseText;
          }
          $('#responseOutput').text(errorMsg);
        }
      });
    } else {
      if (!receivingGroup || !customString1 || !configurationItemId || !type || !impact || !urgency || !description) {
        $('#responseOutput').text('Missing required parameters. Please provide receivingGroup, customString1, configurationItemId, type, impact, urgency and description.');
        $('#responseOutput').show();
        return;
      }
      const payload = {
        receivingGroup,
        customString1,
        configurationItemId,
        type,
        impact,
        urgency,
        description
      };
      refreshTokenAndRetry(payload,
        function (response) {
          $('#responseOutput').show();
          if (response.callRef) {
            $btn.hide();
            $('#responseOutput').html(
              'Call created and submitted successfully. Reference: <strong>' + response.callRef + '</strong>'
            );
          } else {
            $('#responseOutput').text('API call succeeded but no call reference returned.');
          }
        },
        function (xhr) {
          $('#responseOutput').show();
          let errorMsg = 'API call failed.';
          if (xhr.responseText) {
            errorMsg += ' ' + xhr.responseText;
          }
          $('#responseOutput').text(errorMsg);
        }
      );
    }
  });
});