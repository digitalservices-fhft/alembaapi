$(document).ready(function () {
  function getParam(param, defaultValue = null) {
    const params = new URLSearchParams(window.location.search);
    return params.has(param) ? params.get(param) : defaultValue;
  }

  let accessToken = '';
  const $btn = $('#callApiBtn');
  $('#responseOutput').hide();
  $btn.hide();

  const codeType = getParam('codeType', 'call');
  const receivingGroup = getParam('receivingGroup');
  const customString1 = getParam('customString1');
  const configurationItemId = getParam('configurationItemId');
  const type = getParam('type');
  const impact = getParam('impact');
  const urgency = getParam('urgency');
  const boardTitle = getParam('title');
  const purchase = getParam('purchase');
  const transactionStatus = getParam('transactionStatus');

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

  if (boardTitle) {
    $('h1.mb-4').text(boardTitle);
  }

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

  $btn.click(function () {
    const description = $('#descriptionInput').val();

    if (codeType === 'inf') {
      const imageFile = $('#imageInput')[0].files[0];
      const urlParams = new URLSearchParams(window.location.search);
      let ajaxUrl = '/make-call';
      if (urlParams.toString()) {
        ajaxUrl += '?' + urlParams.toString();
      }

      if (!description) {
        $('#responseOutput').text('Description is required.');
        $('#responseOutput').show();
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
        data: formData,
        success: function (response) {
          $('#responseOutput').show();
          if (response.callRef) {
            $btn.hide();
            $('#responseOutput').html(
              `<div class="alert alert-success">Reference: <b>${response.callRef}</b><br>${response.message}</div>`
            );
          } else if (response.message) {
            $('#responseOutput').html(
              `<div class="alert alert-info">${response.message}</div>`
            );
          }
        },
        error: function (xhr) {
          $('#responseOutput').html(
            `<div class="alert alert-danger">${xhr.responseText}</div>`
          ).show();
        }
      });
    } else if (codeType === 'stock') {
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
              'Call created and submitted successfully. Reference: <strong>' + response.callRef + '</strong>'
            );
          } else {
            $('#responseOutput').text('API call succeeded but no call reference returned.');
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
    }
  });
});