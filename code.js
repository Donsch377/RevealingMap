const map = L.map('map').setView([0, 0], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

const mask = document.getElementById('mask');
const exploreBtn = document.getElementById('explore');
const RADIUS_METERS = 9;
let watchId;

function updateMask(latlng) {
  map.setView(latlng);
  const point = map.latLngToContainerPoint(latlng);
  const latlngRight = map.containerPointToLatLng([point.x + 1, point.y]);
  const metersPerPixel = latlng.distanceTo(latlngRight);
  const radiusPx = RADIUS_METERS / metersPerPixel;
  mask.style.clipPath = `circle(${radiusPx}px at ${point.x}px ${point.y}px)`;
}

function onLocation(pos) {
  const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
  updateMask(latlng);
}

function startExplore() {
  if (watchId) return;
  mask.style.display = 'block';
  if (!navigator.geolocation) {
    alert('Geolocation not supported');
    return;
  }
  watchId = navigator.geolocation.watchPosition(onLocation);
}

exploreBtn.addEventListener('click', startExplore);
