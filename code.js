const map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const fog = document.getElementById('fog');
const btn = document.getElementById('exploreBtn');
let watchId;
let userMarker;

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
  const latlng = [lat, lng];

  if (!userMarker) {
    userMarker = L.circleMarker(latlng, {
      radius: 5,
      color: '#fff',
      fillColor: '#fff',
      fillOpacity: 1
    }).addTo(map);
  } else {
    userMarker.setLatLng(latlng);
  }

  map.setView(latlng, 18);

  const radiusMeters = 9; // ~30 feet
  const lngOffset = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));
  const pointCenter = map.latLngToContainerPoint(latlng);
  const pointEast = map.latLngToContainerPoint([lat, lng + lngOffset]);
  const radiusPx = pointEast.x - pointCenter.x;

  fog.style.clipPath = `circle(${radiusPx}px at ${pointCenter.x}px ${pointCenter.y}px)`;
}

function onError(err) {
  console.error(err);
}
