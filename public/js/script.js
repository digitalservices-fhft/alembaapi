let authToken = null;

$(document).ready(function () {
  // Fetch token on load
  $.get('/api/get-token', function (data) {
    authToken = data.token;
  });

  // Handle form submission
  $('#ticketForm').on('submit', function (e) {
    e.preventDefault();
    const ReceivingGroup = $('#ReceivingGroup').val();
    const CustomString1 = $('#CustomString1').val();
    const ConfigurationItemId = $('#ConfigurationItemId').val();

    $.ajax({
      url: '/api/submit-ticket',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ ReceivingGroup, CustomString1, ConfigurationItemId }),
      success: function (response) {
        $('#message').html(
          `<div class="alert alert-success">Thank you for logging the issue. Ticket "<strong>${response.ref}</strong>" has been logged.</div>`
        );
        $('#submitBtn').hide();
      },
      error: function () {
        $('#message').html(
          '<div class="alert alert-danger">There was an error submitting the ticket.</div>'
        );
      }
    });
  });
});
