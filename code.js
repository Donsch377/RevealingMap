const map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const fog = document.getElementById('fog');
const btn = document.getElementById('exploreBtn');
const simulateBtn = document.getElementById('simulateBtn');
let watchId;
let userMarker;
let userLatLng;
const RADIUS_METERS = 50;
let visitedAreas = JSON.parse(localStorage.getItem('visitedAreas') || '[]');

map.on('move', updateFog);

map.whenReady(() => {
  if (visitedAreas.length > 0) {
    map.setView(visitedAreas[visitedAreas.length - 1], 18);
    updateFog();
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

function updateFog() {
  if (visitedAreas.length === 0) return;

  const masks = visitedAreas.map(([lat, lng]) => {
    const lngOffset = RADIUS_METERS / (111320 * Math.cos(lat * Math.PI / 180));
    const pointCenter = map.latLngToContainerPoint([lat, lng]);
    const pointEast = map.latLngToContainerPoint([lat, lng + lngOffset]);
    const radiusPx = pointEast.x - pointCenter.x;
    return `radial-gradient(circle at ${pointCenter.x}px ${pointCenter.y}px, transparent ${radiusPx}px, black ${radiusPx}px)`;
  });

  const mask = masks.join(',');
  fog.style.maskImage = mask;
  fog.style.webkitMaskImage = mask;
  const composite = Array(masks.length - 1).fill('exclude').join(',');
  fog.style.maskComposite = composite;
  const webkitComposite = Array(masks.length - 1).fill('destination-out').join(',');
  fog.style.webkitMaskComposite = webkitComposite;
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
