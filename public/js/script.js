$(document).ready(function () {
let accessToken = null;
$.get("/api/get-token", function(data) {
    accessToken = data.token;
});

  // Helper function to get URL parameters
  function getParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Extract parameters from URL
  const ReceivingGroup = parseInt(getParam("ReceivingGroup"));
  const CustomString1 = getParam("CustomString1");
  const ConfigurationItemId = parseInt(getParam("ConfigurationItemId"));
  const pageTitle = getParam("Title");

  // Update page title if provided
  if (pageTitle) {
    $("#pageTitle").text(pageTitle);
  }

  // Handle button click
  $("#submitBtn").on("click", function () {
    const ticketData = {
      Description: "Logged Via Chris & Jon's Magic Api",
      DescriptionHtml: "<p>Logged Via Chris & Jon's Magic Api</p>",
      IpkStatus: 1,
      IpkStream: 0,
      Location: 23427,
      Impact: 1,
      Urgency: 4,
      ReceivingGroup: ReceivingGroup,
      Type: 149,
      CustomString1: CustomString1,
      ConfigurationItemId: ConfigurationItemId,
      User: 34419
    };

    $.ajaxSetup({ headers: { 'Authorization': 'Bearer ' + accessToken } });
        $.ajax({
      url: "/api/submit-ticket",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(ticketData),
      success: function (response) {
        $("#message").html(
          `<div class="alert alert-success">Thank you! Your ticket has been logged under "<strong>${response.ref}</strong>".</div>`
        );
        $("#submitBtn").hide();
      },
      error: function () {
        $("#message").html(
          '<div class="alert alert-danger">There was an error submitting the ticket.</div>'
        );
      }
    });
  });
});
