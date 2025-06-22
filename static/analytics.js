// визуализация аналитики

import { formatPrice } from './utils.js';

const COLORS = {
  primary:   "#1f2937", // угольно-серый (почти чёрный)
  accent:    "#6b7280", // графитовый
  neutral:   "#e5e7eb"  // светло-серый
};

document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/analytics")
    .then(res => res.json())
    .then(data => renderAnalytics(data))
    .catch(err => console.error("Ошибка загрузки аналитики", err));
});

function renderAnalytics(data) {
  document.getElementById("stat-total").textContent = data.total_listings;
  document.getElementById("stat-average").textContent = formatPrice(data.avg_price) + " ₽";
  document.getElementById("stat-top").textContent = data.top_cities.length
    ? data.top_cities.map((c) => c.city).join(", ")
    : "Нет данных";

  renderBarChart(data.top_cities);
  renderStatusChart(data.status_distribution);
  renderPriceDonutChart(data.status_prices, data.total_price);
  renderPriceHistogramChart(data.price_ranges);
}

function renderBarChart(topCities) {
  const ctx = document.getElementById("cityChart").getContext("2d");
  const fallback = document.getElementById("cityChart-empty");

  if (!topCities.length) {
    fallback.style.display = "block";
    return;
  } else {
    fallback.style.display = "none";
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: topCities.map(c => c.city),
      datasets: [{
        label: "Количество объявлений",
        data: topCities.map(c => c.count),
        backgroundColor: COLORS.primary,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, stepSize: 1 }
        }
      }
    }
  });
}

function renderStatusChart(statusData) {
  const ctx = document.getElementById("statusChart").getContext("2d");
  const fallback = document.getElementById("statusChart-empty");
  const labels = Object.keys(statusData);
  const values = Object.values(statusData);

  const hasData = values.some(v => v > 0);

  if (!hasData) {
    fallback.style.display = "block";
    return;
  } else {
    fallback.style.display = "none";
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Количество объявлений",
        data: values,
        backgroundColor: [COLORS.primary, COLORS.neutral, COLORS.accent],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, stepSize: 1 }
        }
      }
    }
  });
}

function renderPriceDonutChart(statusPriceData, totalPrice) {
  const ctx = document.getElementById("priceStatusChart").getContext("2d");
  const fallback = document.getElementById("priceStatusChart-empty");

  const labels = Object.keys(statusPriceData);
  const values = Object.values(statusPriceData);

  const hasData = values.some(v => v > 0);

  if (!hasData) {
    fallback.style.display = "block";
    return;
  } else {
    fallback.style.display = "none";
  }

  const totalFormatted = Math.round(totalPrice).toLocaleString("ru-RU") + " ₽";

  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart) {
      const { chartArea: area, ctx } = chart;
      const centerX = (area.left + area.right) / 2;
      const centerY = (area.top + area.bottom) / 2;

      ctx.save();
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(totalFormatted, centerX, centerY);
      ctx.restore();
    }
  };

  const colors = {
    "продано": COLORS.accent,
    "не продано": COLORS.neutral
  };

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map(label => colors[label] || "#ccc")
      }]
    },
    options: {
      responsive: true,
      cutout: "60%",
      plugins: {
        legend: {
          position: "right",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 20,
            font: { size: 14 },
            generateLabels: (chart) => {
              const ds = chart.data.datasets[0];
              return chart.data.labels.map((label, i) => ({
                text: `${Number(ds.data[i]).toLocaleString("ru-RU")} ₽\n${label}`,
                fillStyle: ds.backgroundColor[i],
                strokeStyle: ds.backgroundColor[i],
                pointStyle: "circle",
                index: i
              }));
            }
          }
        }
      }
    },
    plugins: [centerTextPlugin]
  });
}

function renderPriceHistogramChart(priceRanges) {
  const ctx = document.getElementById("priceDistributionChart").getContext("2d");
  const fallback = document.getElementById("priceDistributionChart-empty");

  if (!priceRanges.length) {
    fallback.style.display = "block";
    return;
  } else {
    fallback.style.display = "none";
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: priceRanges.map(p => p.label),
      datasets: [{
        label: "Количество объявлений",
        data: priceRanges.map(p => p.count),
        backgroundColor: COLORS.accent,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}
