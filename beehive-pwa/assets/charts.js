// Chart utilities
function createChart(canvasId, config) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element with id '${canvasId}' not found`);
    return null;
  }
  
  return new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      datasets: [{
        label: config.label,
        data: [],
        borderColor: config.borderColor,
        backgroundColor: config.backgroundColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: config.borderColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return new Date(context[0].parsed.x).toLocaleString();
            },
            label: function(context) {
              return `${config.label}: ${context.parsed.y.toFixed(1)}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'hour',
            displayFormats: {
              hour: 'HH:mm',
              day: 'MMM DD'
            }
          },
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b',
            maxTicksLimit: 6
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#e2e8f0',
            borderDash: [2, 2]
          },
          ticks: {
            color: '#64748b',
            callback: function(value) {
              return value.toFixed(1);
            }
          }
        }
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 6
        }
      },
      animation: {
        duration: 300,
        easing: 'easeInOutQuart'
      }
    }
  });
}

function updateChart(chart, data) {
  if (!chart || !data) {
    console.error('Chart or data is null');
    return;
  }
  
  chart.data.datasets[0].data = data;
  chart.update('none');
}
