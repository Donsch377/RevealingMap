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
const revealRadius = 100; // radius in meters

let visitedAreas = JSON.parse(localStorage.getItem('visitedAreas') || '[]');
if (visitedAreas.length > 0) {
  fog.style.display = 'block';
  updateFog();
}

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
  addVisitedArea(userLatLng);
  updateFog();
}

function onError(err) {
  console.error(err);
}

function updateFog() {
  if (visitedAreas.length === 0) return;

  const masks = visitedAreas.map(([lat, lng]) => {
    const lngOffset = revealRadius / (111320 * Math.cos(lat * Math.PI / 180));
    const pointCenter = map.latLngToContainerPoint([lat, lng]);
    const pointEast = map.latLngToContainerPoint([lat, lng + lngOffset]);
    const radiusPx = pointEast.x - pointCenter.x;
    return `radial-gradient(circle at ${pointCenter.x}px ${pointCenter.y}px, transparent ${radiusPx}px, black ${radiusPx}px)`;
  });

  const mask = masks.join(',');
  fog.style.mask = mask;
  fog.style.webkitMask = mask;
}

function addVisitedArea([lat, lng]) {
  const alreadyVisited = visitedAreas.some(([vLat, vLng]) =>
    distance(vLat, vLng, lat, lng) < revealRadius
  );
  if (!alreadyVisited) {
    visitedAreas.push([lat, lng]);
    localStorage.setItem('visitedAreas', JSON.stringify(visitedAreas));
  }
}

function distance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
