$(document).ready(function () {
  const params = new URLSearchParams(window.location.search);
  function getParam(param, defaultValue = null) {
    return params.has(param) ? params.get(param) : defaultValue;
  }
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
      $('#responseOutput').html(
        `<div class="alert alert-danger" role="alert">Failed to retrieve token: ${xhr.responseText}</div>`
      ).show();
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
  if (codeType === 'call') {
    $btn.text('Let us know!');
  } else if (codeType === 'stock') {
    $btn.text('Update stock');
  } else {
    $btn.text('Submit');
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
      $('#image-container').empty();
      for (const keyword in imageMap) {
        if (boardTitle.toLowerCase().includes(keyword)) {
          const img = $('<img>', {
            src: `img/${imageMap[keyword]}`,
            alt: keyword,
            class: "img-fluid",
            onerror: "this.style.display='none'"
          });
          $('#image-container').append(img);
          break;
        }
      }
    }
  }

  if (codeType === 'stock') {
    $('#stockFields').show();
  } else {
    $('#stockFields').hide();
  }

  $btn.click(function () {
    $('#responseOutput').hide().html('');
    if (codeType === 'stock') {
      const quantity = $('#quantityInput').val();
      if (!purchase || !transactionStatus || !quantity) {
        $('#responseOutput').html(
          `<div class="alert alert-warning" role="alert">Missing required parameters for stock: purchase, transactionStatus, or quantity.</div>`
        ).show();
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
              `<div class="alert alert-success" role="alert">Stock transaction submitted successfully. Reference: <strong>${response.callRef}</strong></div>`
            );
          } else {
            $('#responseOutput').html(
              `<div class="alert alert-info" role="alert">API call succeeded but no reference returned.</div>`
            );
          }

          // Additional reverse transaction if status is 4
          if (parseInt(transactionStatus, 10) === 4) {
            const reversePayload = {
              codeType: 'stock',
              purchase: parseInt(purchase, 10),
              transactionStatus: 2,
              quantity: -parseInt(quantity, 10)
            };
            $.ajax({
              url: '/make-call',
              method: 'POST',
              contentType: 'application/json',
              data: JSON.stringify(reversePayload),
              success: function (reverseResponse) {
                if (reverseResponse.callRef) {
                  $('#responseOutput').append(
                    `<div class="alert alert-success mt-2" role="alert">Reverse transaction submitted. Reference: <strong>${reverseResponse.callRef}</strong></div>`
                  );
                }
              },
              error: function (xhr) {
                $('#responseOutput').append(
                  `<div class="alert alert-danger mt-2" role="alert">Reverse transaction failed: ${xhr.responseText}</div>`
                );
              }
            });
          }
        },
        error: function (xhr) {
          let errorMsg = 'API call failed.';
          if (xhr.responseText) {
            errorMsg += ' ' + xhr.responseText;
          }
          $('#responseOutput').html(
            `<div class="alert alert-danger" role="alert">${errorMsg}</div>`
          ).show();
        }
      });
    } else {
      if (!receivingGroup || !customString1 || !configurationItemId || !type || !impact || !urgency || !description) {
        $('#responseOutput').html(
          `<div class="alert alert-warning" role="alert">Missing required parameters. Please provide receivingGroup, customString1, configurationItemId, type, impact, urgency and description.</div>`
        ).show();
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
              `<div class="alert alert-success" role="alert">Call created and submitted successfully. Reference: <strong>${response.callRef}</strong></div>`
            );
          } else {
            $('#responseOutput').html(
              `<div class="alert alert-info" role="alert">API call succeeded but no call reference returned.</div>`
            );
          }
        },
        error: function (xhr) {
          let errorMsg = 'API call failed.';
          if (xhr.responseText) {
            errorMsg += ' ' + xhr.responseText;
          }
          $('#responseOutput').html(
            `<div class="alert alert-danger" role="alert">${errorMsg}</div>`
          ).show();
        }
      });
    }
  });
});