let map, userMarker, routeLine;
let lastCoords = null;
let currentRouteCoords = null;

// Build a loop of randomized waypoints around the start to explore nearby streets.
function buildLoopWaypoints(start, desiredMeters) {
  const minRadiusM = 80; // keep loops from being too tiny
  const circumference = Math.max(desiredMeters, minRadiusM * 2 * Math.PI);
  const rMeters = circumference / (2 * Math.PI);
  const latRad = start.lat * Math.PI / 180;
  const dLat = rMeters / 111000; // deg latitude per meter
  const dLng = rMeters / (111000 * Math.cos(latRad)); // deg longitude per meter (scaled by latitude)

  // Choose 4–8 waypoints based on distance (roughly one every ~400m), add jitter for variety
  const N = Math.min(8, Math.max(4, Math.round(desiredMeters / 400)));
  const pts = [];
  for (let i = 0; i < N; i++) {
    const base = (i / N) * 2 * Math.PI;
    const jitter = (Math.random() - 0.5) * 0.4; // +/- ~23°
    const angle = base + jitter;
    const rLat = dLat * (0.85 + Math.random() * 0.30);
    const rLng = dLng * (0.85 + Math.random() * 0.30);
    const lat = start.lat + rLat * Math.sin(angle);
    const lng = start.lng + rLng * Math.cos(angle);
    pts.push([lng, lat]); // OSRM expects [lng,lat]
  }
  return pts;
}

async function generatePath(distanceMeters, coords) {
  if (routeLine) {
    map.removeLayer(routeLine);
  }
  currentRouteCoords = null;

  let attempt = 0;
  let scale = 1.0;

  while (attempt < 3) {
    // Build randomized loop waypoints around the start; start -> wps... -> start
    const wps = buildLoopWaypoints(coords, distanceMeters * scale);
    const coordsList = [[coords.lng, coords.lat], ...wps, [coords.lng, coords.lat]];
    const coordString = coordsList.map(c => c.join(',')).join(';');
    const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?overview=full&geometries=geojson`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geo = route.geometry;
        // Draw
        routeLine = L.geoJSON(geo, { style: { color: 'cyan' } }).addTo(map);
        map.fitBounds(routeLine.getBounds());
        currentRouteCoords = geo.coordinates;

        // If the distance is far off, scale radius and retry
        const actual = route.distance; // meters
        const ratio = actual / distanceMeters;
        if (ratio < 0.85 || ratio > 1.15) {
          // Adjust scale to push toward the target distance
          if (ratio < 0.85) scale *= 1.20;
          else scale *= 0.85;
          map.removeLayer(routeLine);
          routeLine = null;
          currentRouteCoords = null;
          attempt++;
          continue;
        }
        // Good enough
        break;
      } else {
        attempt++;
      }
    } catch (e) {
      console.error('OSRM fetch failed', e);
      attempt++;
    }
  }
}

function openInGoogleMaps() {
  if (!currentRouteCoords || currentRouteCoords.length < 2) return;

  // Sample down to a manageable number of points for the URL (<= 20 waypoints total)
  const maxPts = 22; // origin + 20 waypoints + destination
  const step = Math.max(1, Math.floor(currentRouteCoords.length / maxPts));
  const sampled = currentRouteCoords.filter((_, i) => i % step === 0);
  if (sampled[sampled.length - 1] !== currentRouteCoords[currentRouteCoords.length - 1]) {
    sampled.push(currentRouteCoords[currentRouteCoords.length - 1]);
  }

  const origin = sampled[0];
  const destination = sampled[sampled.length - 1];
  const waypoints = sampled.slice(1, -1).map(c => `${c[1]},${c[0]}`).join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin[1]},${origin[0]}&destination=${destination[1]},${destination[0]}&travelmode=walking`;
  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }
  window.open(url, '_blank');
}

function stepsToMeters(steps, feet, inches) {
  let heightCm = 0;
  if (feet || inches) {
    let totalInches = (feet || 0) * 12 + (inches || 0);
    heightCm = totalInches * 2.54;
  }
  let stepLength = heightCm ? heightCm * 0.415 / 100 : 0.75;
  return steps * stepLength;
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
