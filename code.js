const map = L.map('map').setView([0, 0], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const exploreBtn = document.getElementById('explore');
const fog = document.getElementById('fog');

let watchId = null;
const revealRadius = 9; // meters (~30 ft)

function metersToPixels(meters, latlng) {
  const latlngOffset = L.latLng(latlng.lat, latlng.lng + 0.0001);
  const p1 = map.latLngToContainerPoint(latlng);
  const p2 = map.latLngToContainerPoint(latlngOffset);
  const metersPerPixel = latlng.distanceTo(latlngOffset) / p1.distanceTo(p2);
  return meters / metersPerPixel;
}

function updateFog(latlng) {
  const point = map.latLngToContainerPoint(latlng);
  const radiusPixels = metersToPixels(revealRadius, latlng);
  fog.style.setProperty('--x', `${point.x}px`);
  fog.style.setProperty('--y', `${point.y}px`);
  fog.style.setProperty('--r', `${radiusPixels}px`);
}

exploreBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }
  if (watchId !== null) {
    return; // already tracking
  }
  watchId = navigator.geolocation.watchPosition(
    pos => {
      const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
      map.setView(latlng, 18);
      updateFog(latlng);
    },
    err => {
      console.error(err);
      alert('Unable to retrieve your location');
    },
    { enableHighAccuracy: true }
  );
});
