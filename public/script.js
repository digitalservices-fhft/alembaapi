// public/script.js
$(function () {
  $('#responseOutput').text('Loading authentication token...');

  const params = new URLSearchParams(window.location.search);

  function getParam(param, defaultValue = null) {
    return params.has(param) ? params.get(param) : defaultValue;
  }

  const boardTitle = getParam('title');
  if (boardTitle) {
    $('h1.mb-4').text(boardTitle);
  }

  const codeType = getParam('codeType', 'call');
  const receivingGroup = getParam('receivingGroup');
  const customString1 = getParam('customString1');
  const configurationItemId = getParam('configurationItemId');
  const type = getParam('type');
  const description = getParam('description');
  const purchase = getParam('purchase');
  const transactionStatus = getParam('transactionStatus');

  let accessToken = '';

  $('#callApiBtn').hide();

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


// Show quantity input only if codeType=stock
  const params = new URLSearchParams(window.location.search);
  if (params.get('codeType') === 'stock') {
    document.getElementById('stockFields').style.display = 'block';
  }


  $('#callApiBtn').click(function () {
    if (codeType === 'stock') {
      const quantity = $('#quantityInput').val();
      if (!purchase || !transactionStatus || !quantity) {
        $('#responseOutput').text('Missing required parameters for stock: purchase, transactionStatus, or quantity.');
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
          if (response.callRef) {
            $('#callApiBtn').hide();
            $('#responseOutput').html(
              '<div class="alert alert-success"><center>Stock transaction submitted successfully. Reference: <b>' +
              response.callRef +
              '</b></center></div>'
            );
          } else {
            $('#responseOutput').text('API call succeeded but no reference returned.');
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
    } else {
      if (!receivingGroup || !customString1 || !configurationItemId || !type || !description) {
        $('#responseOutput').text('Missing required parameters. Please provide receivingGroup, customString1, configurationItemId, type, and description.');
        return;
      }

      const payload = {
        receivingGroup,
        customString1,
        configurationItemId,
        type,
        description
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
    }
  });
});