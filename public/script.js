  $(document).ready(function () {
  const params = new URLSearchParams(window.location.search);

  function getParam(param, defaultValue = null) {
    return params.has(param) ? params.get(param) : defaultValue;
  }

   // Get Auth Token for API
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
  const description = getParam('description');
  const impact = getParam('impact');
  const urgency = getParam('urgency');
  const purchase = getParam('purchase');
  const transactionStatus = getParam('transactionStatus');

  let accessToken = '';

  // Hide Response form

  $('#responseOutput').hide();

  // Change button wording depending on codeType
  
    var $btn = $('#callApiBtn');

    // Determine the button text based on codeType
    if (codeType === 'call') {
        $btn.text('Let us know!');
        $btn.show();
    } else if (codeType === 'stock') {
        $btn.text('Update stock');
        $btn.show();
    } else {
        $btn.text('Submit');
        $btn.show();
    }
  
  // Image logic for stock codeType
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
      // Clear previous images to avoid duplicates
      $('#image-container').empty();
      for (const keyword in imageMap) {
        if (boardTitle.toLowerCase().includes(keyword)) {
          const img = $('<img>', {
            src: `img/${imageMap[keyword]}`,
            alt: keyword,
            onerror: "this.style.display='none'"
          });
          $('#image-container').append(img);
          break;
        }
      }
    }
  }

  // Show or hide stock fields
if (codeType === 'stock') {
    $('#stockFields').show();
} else {
    $('#stockFields').hide();
}

  $btn.hide(); // Hide button until token is loaded

  // Check parameters for stock control or Call, add payload and call API
  $btn.click(function () {
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
          $('#responseOutput').show();
          if (response.callRef) {
            $btn.hide();
            $('#responseOutput').html('<div class="alert alert-success" role="alert">' + response.callRef + '</div>');
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
          $('#responseOutput').html('<div class="alert alert-danger" role="alert">' + errorMsg + '</div>');
        }
      });
    } else {
      if (!receivingGroup || !customString1 || !configurationItemId || !type || !impact || !urgency || !description) {
        $('#responseOutput').text('Missing required parameters. Please provide receivingGroup, customString1, configurationItemId, type, impact, urgency and description.');
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
            $('#responseOutput').html('<div class="alert alert-success" role="alert">' + response.callRef + '</div>');
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
          $('#responseOutput').html('<div class="alert alert-danger" role="alert">' + errorMsg + '</div>');
        }
      });
    }
  });
});