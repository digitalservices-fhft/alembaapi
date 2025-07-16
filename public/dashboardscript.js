  document.getElementById('filterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const params = new URLSearchParams(form).toString();
    const res = await fetch(`/api/calls?${params}`);
    const data = await res.json();
    const labels = data.map(d => d.ActualLogDate);
    const hours = data.map(d => d.ActionWorkHours);

    new Chart(document.getElementById('callChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Work Hours',
          data: hours,
          backgroundColor: 'rgba(60,141,188,0.9)'
        }]
      }
    });
  });