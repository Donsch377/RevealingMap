const map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const fogCanvas = document.getElementById('fog');
const fogCtx = fogCanvas.getContext('2d');
const btn = document.getElementById('exploreBtn');
const simulateBtn = document.getElementById('simulateBtn');
let watchId;
let userMarker;
let userLatLng;
const RADIUS_METERS = 50;
let visitedAreas = JSON.parse(localStorage.getItem('visitedAreas') || '[]');

map.on('move', updateFog);
map.on('resize', resizeFog);

map.whenReady(() => {
  resizeFog();
  if (visitedAreas.length > 0) {
    map.setView(visitedAreas[visitedAreas.length - 1], 18);
  }
});

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

simulateBtn.addEventListener('click', simulateWalk);

function onLocation(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  userLatLng = [lat, lng];
  addVisitedArea(userLatLng);

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

function addVisitedArea(latlng) {
  visitedAreas.push(latlng);
  localStorage.setItem('visitedAreas', JSON.stringify(visitedAreas));
}

function resizeFog() {
  const size = map.getSize();
  fogCanvas.width = size.x;
  fogCanvas.height = size.y;
  updateFog();
}

function updateFog() {
  const size = map.getSize();
  fogCtx.clearRect(0, 0, size.x, size.y);
  fogCtx.fillStyle = 'rgba(255,255,255,0.99)';
  fogCtx.fillRect(0, 0, size.x, size.y);
  fogCtx.globalCompositeOperation = 'destination-out';

  visitedAreas.forEach(([lat, lng]) => {
    const lngOffset = RADIUS_METERS / (111320 * Math.cos(lat * Math.PI / 180));
    const center = map.latLngToContainerPoint([lat, lng]);
    const east = map.latLngToContainerPoint([lat, lng + lngOffset]);
    const radiusPx = east.x - center.x;
    fogCtx.beginPath();
    fogCtx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2);
    fogCtx.fill();
  });

  fogCtx.globalCompositeOperation = 'source-over';
}

function simulateWalk() {
  let steps = 0;
  const stepDistance = 0.0001;
  if (!userLatLng) {
    userLatLng = [map.getCenter().lat, map.getCenter().lng];
  }
  if (!userMarker) {
    userMarker = L.circleMarker(userLatLng, {
      radius: 5,
      color: '#fff',
      fillColor: '#fff',
      fillOpacity: 1
    }).addTo(map);
  }
  const intervalId = setInterval(() => {
    userLatLng = [userLatLng[0] + stepDistance, userLatLng[1]];
    addVisitedArea(userLatLng);
    userMarker.setLatLng(userLatLng);
    map.setView(userLatLng, 18);
    updateFog();
    steps++;
    if (steps > 20) {
      clearInterval(intervalId);
    }
  }, 1000);
}
