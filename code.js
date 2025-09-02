const map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const fogCanvas = document.getElementById('fog');
const fogCtx = fogCanvas.getContext('2d');
const btn = document.getElementById('exploreBtn');
let watchId;
let userMarker;
let userLatLng;
let visitedAreas = JSON.parse(localStorage.getItem('visitedAreas') || '[]');

map.on('move', updateFog);

if (visitedAreas.length) {
  fogCanvas.style.display = 'block';
  updateFog();
}

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
  fogCanvas.style.display = 'block';

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

function updateFog() {
  if (!visitedAreas.length) return;
  const size = map.getSize();
  if (fogCanvas.width !== size.x || fogCanvas.height !== size.y) {
    fogCanvas.width = size.x;
    fogCanvas.height = size.y;
  }

  fogCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
  fogCtx.fillStyle = 'black';
  fogCtx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);
  fogCtx.globalCompositeOperation = 'destination-out';

  const radiusMeters = 100; // reveal radius in meters

  visitedAreas.forEach(area => {
    const lat = area[0];
    const lng = area[1];
    const lngOffset = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));
    const pointCenter = map.latLngToContainerPoint([lat, lng]);
    const pointEast = map.latLngToContainerPoint([lat, lng + lngOffset]);
    const radiusPx = pointEast.x - pointCenter.x;

    fogCtx.beginPath();
    fogCtx.arc(pointCenter.x, pointCenter.y, radiusPx, 0, Math.PI * 2);
    fogCtx.fill();
  });

  fogCtx.globalCompositeOperation = 'source-over';
}

function addVisitedArea(latLng) {
  visitedAreas.push(latLng);
  localStorage.setItem('visitedAreas', JSON.stringify(visitedAreas));
}
