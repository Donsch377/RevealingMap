const map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const fog = document.getElementById('fog');
const btn = document.getElementById('exploreBtn');
let watchId;
let userMarker;
let userLatLng;

map.on('move', updateFog);

btn.addEventListener('click', () => {
  if (watchId) {
    return;
  }
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }
  watchId = navigator.geolocation.watchPosition(onLocation, onError, {
    enableHighAccuracy: true
  });
});

function onLocation(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  userLatLng = [lat, lng];
  fog.style.display = 'block';

  if (!userMarker) {
    userMarker = L.circleMarker(userLatLng, {
      radius: 5,
      color: '#fff',
      fillColor: '#fff',
      fillOpacity: 1
    }).addTo(map);
  } else {
    userMarker.setLatLng(userLatLng);
  }

  map.setView(userLatLng, 18);

  updateFog();
}

function onError(err) {
  console.error(err);
}

function updateFog() {
  if (!userLatLng) return;

  const lat = userLatLng[0];
  const lng = userLatLng[1];
  const radiusMeters = 100; // reveal radius in meters
  const lngOffset = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));
  const pointCenter = map.latLngToContainerPoint(userLatLng);
  const pointEast = map.latLngToContainerPoint([lat, lng + lngOffset]);
  const radiusPx = pointEast.x - pointCenter.x;

  const mask = `radial-gradient(circle at ${pointCenter.x}px ${pointCenter.y}px, transparent ${radiusPx}px, black ${radiusPx}px)`;
  fog.style.mask = mask;
  fog.style.webkitMask = mask;
}
