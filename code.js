let map, userMarker, routeLine;
let lastCoords = null;
let currentRouteCoords = null;

function stepsToMeters(steps, feet, inches) {
  let heightCm = 0;
  if (feet || inches) {
    let totalInches = (feet || 0) * 12 + (inches || 0);
    heightCm = totalInches * 2.54;
  }
  let stepLength = heightCm ? heightCm * 0.415 / 100 : 0.75;
  return steps * stepLength;
}

function generatePath(distanceMeters, coords) {
  if (routeLine) {
    map.removeLayer(routeLine);
  }

  // Generate a rough destination point offset north
  let offset = distanceMeters / 111000;
  let destLat = coords.lat + offset;
  let destLng = coords.lng;

  let url = `https://router.project-osrm.org/route/v1/foot/${coords.lng},${coords.lat};${destLng},${destLat}?overview=full&geometries=geojson`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.routes && data.routes.length > 0) {
        let route = data.routes[0].geometry;
        routeLine = L.geoJSON(route, { style: { color: 'cyan' } }).addTo(map);
        map.fitBounds(routeLine.getBounds());
        // Store route coordinates for Google Maps export
        currentRouteCoords = route.coordinates;
      } else {
        currentRouteCoords = null;
      }
    })
    .catch(() => {
      currentRouteCoords = null;
    });
}

function openInGoogleMaps() {
  if (!currentRouteCoords) return;
  let origin = currentRouteCoords[0];
  let destination = currentRouteCoords[currentRouteCoords.length - 1];
  let waypoints = currentRouteCoords.slice(1, -1).map(c => c[1] + "," + c[0]).join("|");
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin[1]},${origin[0]}&destination=${destination[1]},${destination[0]}&travelmode=walking`;
  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }
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
    let feet = parseInt(document.getElementById('heightFeet').value);
    let inches = parseInt(document.getElementById('heightInches').value);
    if (steps && lastCoords) {
      let meters = stepsToMeters(steps, feet, inches);
      generatePath(meters, lastCoords);
    }
  });

  document.getElementById('redoBtn').addEventListener('click', () => {
    if (lastCoords) {
      let steps = parseInt(document.getElementById('stepsInput').value);
      let feet = parseInt(document.getElementById('heightFeet').value);
      let inches = parseInt(document.getElementById('heightInches').value);
      let meters = stepsToMeters(steps, feet, inches);
      generatePath(meters, lastCoords);
    }
  });

  document.getElementById('gmapsBtn').onclick = openInGoogleMaps;
});
