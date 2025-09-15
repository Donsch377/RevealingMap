const map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Create and append the fog canvas after Leaflet has initialized the map
const fogCanvas = document.createElement('canvas');
fogCanvas.id = 'fog';
map.getContainer().appendChild(fogCanvas);
const ctx = fogCanvas.getContext('2d');
const exploreBtn = document.getElementById('explore');
const simulateBtn = document.getElementById('simulate');
const resetBtn = document.getElementById('reset-xp');
const levelFill = document.getElementById('level-bar-fill');
const levelText = document.getElementById('level-bar-text');

const RADIUS_METERS = 50;
const AREA_PER_REVEAL = Math.PI * RADIUS_METERS * RADIUS_METERS;
const XP_PER_SQUARE_METER = 0.001;

function renderLevelBar(p) {
  levelFill.style.width = `${p.percent}%`;
  levelText.textContent = `Level ${p.level} (${p.title})`;
}

LevelSystem.onProgress((p) => {
  renderLevelBar(p);
  console.log(`Level ${p.level} (${p.title}) - ${p.xp}/${p.required} XP`);
});

LevelSystem.onLevelUp((lvl, title) => {
  console.log(`Level up! Now level ${lvl}: ${title}`);
});

renderLevelBar(LevelSystem.getProgress());
// Enlarges the fog canvas beyond the map size so that the white fog
// continues to cover the map when zooming out. A larger multiplier
// means more padding around the map.
const FOG_CANVAS_MULTIPLIER = 3;
let marker;
let revealed = JSON.parse(localStorage.getItem('revealed') || '[]');
let lastReveal = revealed.length
  ? { lat: revealed[revealed.length - 1].lat, lng: revealed[revealed.length - 1].lng }
  : null;

map.whenReady(() => {
  resizeCanvas();
  if (revealed.length) {
    const last = revealed[revealed.length - 1];
    map.setView(last, 18);
  }
  drawFog();
});

// Redraw the fog whenever the map is panned or zoomed so the mask
// stays aligned with the map view.
map.on('move zoom', drawFog);

// Keep the fog canvas in sync with Leaflet's zoom animation so that
// the mask scales smoothly together with the map tiles. Without this
// the fog stays static until the zoom animation completes, which
// causes a noticeable lag.
map.on('zoomanim', (e) => {
  const scale = map.getZoomScale(e.zoom);
  const offset = map
    ._getCenterOffset(e.center)
    .multiplyBy(-scale)
    .add(map._getCenterOffset(map.getCenter()));
  L.DomUtil.setTransform(fogCanvas, offset, scale);
});

map.on('zoomend', () => {
  L.DomUtil.setTransform(fogCanvas, new L.Point(0, 0), 1);
  drawFog();
});
window.addEventListener('resize', resizeCanvas);
map.on('resize', resizeCanvas);

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

resetBtn.addEventListener('click', () => {
  LevelSystem.reset();
  revealed = [];
  lastReveal = null;
  localStorage.removeItem('revealed');
  drawFog();
});

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
  const current = { lat, lng };
  let area = AREA_PER_REVEAL;
  if (lastReveal) {
    const d = map.distance(lastReveal, current);
    if (d < 1) {
      return; // ignore jitter
    }
    if (d < 2 * RADIUS_METERS) {
      const r = RADIUS_METERS;
      const overlap =
        2 * r * r * Math.acos(d / (2 * r)) - 0.5 * d * Math.sqrt(4 * r * r - d * d);
      area = AREA_PER_REVEAL - overlap;
    }
  }
  lastReveal = current;
  revealed.push(current);
  localStorage.setItem('revealed', JSON.stringify(revealed));
  if (area > 0) {
    LevelSystem.addXP(area * XP_PER_SQUARE_METER);
  }
  drawFog();
}

function resizeCanvas() {
  const size = map.getSize();
  fogCanvas.width = size.x * FOG_CANVAS_MULTIPLIER;
  fogCanvas.height = size.y * FOG_CANVAS_MULTIPLIER;
  fogCanvas.style.width = fogCanvas.width + 'px';
  fogCanvas.style.height = fogCanvas.height + 'px';
  fogCanvas.style.left = -(FOG_CANVAS_MULTIPLIER - 1) * size.x / 2 + 'px';
  fogCanvas.style.top = -(FOG_CANVAS_MULTIPLIER - 1) * size.y / 2 + 'px';
  drawFog();
}

function drawFog() {
  const size = map.getSize();
  const width = fogCanvas.width;
  const height = fogCanvas.height;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,0.99)';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'destination-out';

  const shiftX = (FOG_CANVAS_MULTIPLIER - 1) * size.x / 2;
  const shiftY = (FOG_CANVAS_MULTIPLIER - 1) * size.y / 2;
  revealed.forEach(({ lat, lng }) => {
    const center = map.latLngToContainerPoint([lat, lng]);
    const edge = map.latLngToContainerPoint([lat, lng + metersToLng(RADIUS_METERS, lat)]);
    const radius = edge.x - center.x;
    ctx.beginPath();
    ctx.arc(center.x + shiftX, center.y + shiftY, radius, 0, Math.PI * 2);
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
