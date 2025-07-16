let chartInstance = null;

$(document).ready(function () {
  const callStatusMap = {
    0: "New", 1: "Resolved", 2: "Assigned", 3: "In Progress", 4: "Awaiting Information",
    5: "Closed", 6: "Re-open", 7: "Awaiting Related Call Resolution", 8: "Awaiting Request",
    9: "Portal Close", 10: "Portal Reopen", 11: "User has updated", 12: "With Supplier",
    13: "Chased", 14: "User Chased", 15: "Awaiting Clinical/Ops Approval", 16: "Escalated"
  };

  const groupMap = {
    0: "Default", 1: "Problem Management Team", 2: "Major Incident Response Team", 3: "Technical Management Group 1",
    4: "Technical Management Group 2", 5: "EPIC Support Team", 6: "Applications Management Group 2",
    7: "IT Operations", 8: "Service Desk", 10: "Infrastructure Support Team", 11: "Desktop - Wexham",
    12: "3rd Line Support", 13: "Desktop - Frimley", 14: "Desktop - Heatherwood", 15: "Desktop - Community - Aldershot (ACfH. Repack)",
    16: "Desktop - Community - Bracknell (Brants Bridge, Heathlands, Skimped Hill)", 17: "Desktop - Community - Farnham",
    18: "Desktop - Community - Farnborough (Voyager, Cody Park)", 19: "Desktop - Community - Fleet",
    20: "Desktop - Community - King Edwards", 21: "Desktop - Community - Mobile (MMU)", 22: "Desktop - Community - St Marks",
    23: "Desktop - Community - Slough (Bath Rd. Lansdowne Ave.)", 25: "Cyber Security Team", 26: "Network Support Team",
    27: "Alto Digital - Managed Print Support", 28: "Telecoms Support Team", 29: "Server Support Team",
    30: "TDA Support Team", 31: "Closure Group", 33: "EPR - Willow", 34: "Information Governance",
    35: "Pathology IT", 36: "Training Team - EPR", 37: "Clinical Apps Support", 38: "Projects Team",
    39: "Escalations", 40: "EPR - Cadence", 41: "EPR - HIM", 42: "EPR - Orders", 43: "EPR - Cogito",
    44: "EPR - ClinDoc", 45: "EPR - Ambulatory", 46: "EPR - Stork", 47: "EPR - Cupid", 48: "EPR - ED & SDEC (ASAP)",
    49: "EPR - MyChart", 50: "EPR - Radiant", 51: "EPR - EpicCare Link", 52: "EPR - Smartcards & PDS",
    53: "EPR - Grand Central", 54: "EPR - Lumens", 55: "EPR - Interfaces", 56: "EPR - Research",
    57: "EPR - Users & Security", 58: "EPR - Labs", 59: "EPR - Optime & Anaesthetics", 61: "EPR - ASAP",
    62: "TDA", 63: "Training Team - Non EPR", 64: "Health Information Services (HIS)", 65: "Desktop - Community - Crowthorne",
    66: "Integrations Team", 67: "EPR - Bugsy", 68: "Request Fulfilment", 69: "Clinical Informatics",
    70: "Test Group", 71: "Colour Print", 72: "OOH - Desktop Frimley", 73: "OOH - Desktop Wexham",
    74: "OOH - EPR", 75: "OOH - Networks", 76: "OOH - Servers Frimley", 77: "OOH - Servers Wexham",
    78: "Clinical Apps Support - Connected Care", 79: "Medical Devices", 80: "EPR - BCA", 81: "EPR-Upgrade",
    82: "Win 11 Issues"
  };

  for (const [key, value] of Object.entries(callStatusMap)) {
    $('#callStatus').append(`<option value="${key}">${value}</option>`);
  }

  for (const [key, value] of Object.entries(groupMap)) {
    $('#resolvingGroup').append(`<option value="${key}">${value}</option>`);
  }

  $('#filterForm').on('submit', async function (e) {
    e.preventDefault();
    const status = $('#callStatus').val() || [];
    const group = $('#resolvingGroup').val() || [];

    $('#progressBar').show();

    try {
      const tokenRes = await fetch('/get-token');
      if (!tokenRes.ok) {
        throw new Error('Failed to retrieve token');
      }

      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        throw new Error('Token missing in response');
      }

      const res = await fetch(`/api/dashboard-data?status=${status.join(',')}&group=${group.join(',')}`);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expired or unauthorized. Please refresh the page.');
        } else {
          throw new Error('Failed to load dashboard data');
        }
      }

      const xmlText = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, "application/xml");

      const labels = [];
      const counts = [];

      xml.querySelectorAll("Month").forEach(month => {
        labels.push(month.querySelector("Date").textContent);
        counts.push(parseInt(month.querySelector("Count").textContent));
      });

      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(document.getElementById('resolvedChart'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Resolved Calls by Month',
            data: counts,
            borderColor: '#007bff',
            fill: false,
            tension: 0.3
          }]
        }
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      alert("Error: " + err.message);
    } finally {
      $('#progressBar').hide();
    }
  });
});
