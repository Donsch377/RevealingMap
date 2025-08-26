let map, userMarker, routeLine;
let lastCoords = null;

function stepsToMeters(steps, heightCm) {
  let stepLength = heightCm ? heightCm * 0.415 / 100 : 0.75; // meters
  return steps * stepLength;
}

function generatePath(distanceMeters, coords) {
  if (routeLine) {
    map.removeLayer(routeLine);
  }
  let lat = coords.lat;
  let lng = coords.lng;

  let offset = distanceMeters / 111000 / 4; 
  let points = [
    [lat, lng],
    [lat + offset, lng],
    [lat + offset, lng + offset],
    [lat, lng + offset],
    [lat, lng]
  ];

  routeLine = L.polyline(points, { color: 'cyan' }).addTo(map);
  map.fitBounds(routeLine.getBounds());

  return points;
}

function openInGoogleMaps(points) {
  if (!points) return;
  let url = `https://www.google.com/maps/dir/?api=1&origin=${points[0][0]},${points[0][1]}&destination=${points[points.length-1][0]},${points[points.length-1][1]}&travelmode=walking`;
  window.open(url, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  map = L.map('map').setView([0, 0], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  navigator.geolocation.getCurrentPosition(pos => {
    let coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    lastCoords = coords;
    userMarker = L.marker([coords.lat, coords.lng]).addTo(map);
    map.setView([coords.lat, coords.lng], 16);
  });

  document.getElementById('generateBtn').addEventListener('click', () => {
    let steps = parseInt(document.getElementById('stepsInput').value);
    let height = parseInt(document.getElementById('heightInput').value);
    if (steps && lastCoords) {
      let meters = stepsToMeters(steps, height);
      let points = generatePath(meters, lastCoords);
      document.getElementById('gmapsBtn').onclick = () => openInGoogleMaps(points);
    }
  });

  document.getElementById('redoBtn').addEventListener('click', () => {
    if (lastCoords) {
      let steps = parseInt(document.getElementById('stepsInput').value);
      let height = parseInt(document.getElementById('heightInput').value);
      let meters = stepsToMeters(steps, height);
      let points = generatePath(meters, lastCoords);
      document.getElementById('gmapsBtn').onclick = () => openInGoogleMaps(points);
    }
  });
});
