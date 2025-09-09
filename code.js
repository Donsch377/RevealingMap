const map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const fogCanvas = document.getElementById('fog');
const ctx = fogCanvas.getContext('2d');
const exploreBtn = document.getElementById('explore');
const simulateBtn = document.getElementById('simulate');

const RADIUS_METERS = 50;
let marker;
let revealed = JSON.parse(localStorage.getItem('revealed') || '[]');

map.whenReady(() => {
  resizeCanvas();
  if (revealed.length) {
    const last = revealed[revealed.length - 1];
    map.setView(last, 18);
  }
  drawFog();
});

map.on('moveend zoomend', drawFog);
window.addEventListener('resize', resizeCanvas);

exploreBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation not supported');
    return;
  }
  navigator.geolocation.getCurrentPosition(onLocate, console.error, {
    enableHighAccuracy: true
  });
  navigator.geolocation.watchPosition(onLocate, console.error, {
    enableHighAccuracy: true
  });
});

simulateBtn.addEventListener('click', simulateWalk);

function onLocate(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  updateMarker([lat, lng]);
  map.setView([lat, lng], 18);
  recordReveal(lat, lng);
}

function updateMarker(latlng) {
  if (!marker) {
    marker = L.circleMarker(latlng, {
      radius: 5,
      color: '#fff',
      fillColor: '#fff',
      fillOpacity: 1
    }).addTo(map);
  } else {
    marker.setLatLng(latlng);
  }
}

function recordReveal(lat, lng) {
  revealed.push({ lat, lng });
  localStorage.setItem('revealed', JSON.stringify(revealed));
  drawFog();
}

function resizeCanvas() {
  const size = map.getSize();
  fogCanvas.width = size.x;
  fogCanvas.height = size.y;
  drawFog();
}

function drawFog() {
  const size = map.getSize();
  ctx.clearRect(0, 0, size.x, size.y);
  ctx.fillStyle = 'rgba(255,255,255,0.99)';
  ctx.fillRect(0, 0, size.x, size.y);
  ctx.globalCompositeOperation = 'destination-out';

  revealed.forEach(({ lat, lng }) => {
    const center = map.latLngToContainerPoint([lat, lng]);
    const edge = map.latLngToContainerPoint([lat, lng + metersToLng(RADIUS_METERS, lat)]);
    const radius = edge.x - center.x;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalCompositeOperation = 'source-over';
}

function metersToLng(meters, lat) {
  return meters / (111320 * Math.cos(lat * Math.PI / 180));
}

function simulateWalk() {
  let steps = 0;
  let current = marker ? marker.getLatLng() : map.getCenter();
  updateMarker(current);
  const interval = setInterval(() => {
    current = [current.lat + 0.0001, current.lng];
    updateMarker(current);
    map.setView(current, 18);
    recordReveal(current[0], current[1]);
    steps++;
    if (steps > 20) {
      clearInterval(interval);
    }
  }, 1000);
}
