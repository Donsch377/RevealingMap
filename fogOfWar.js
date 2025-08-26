// Fog of War module – minimal, isolated, and removable
(function(){
  let map;             // Leaflet map (provided by window.mapRef)
  let canvas = null;   // overlay canvas attached to overlayPane
  let ctx = null;
  let exploring = false;
  let watchId = null;  // geolocation watch handle
  let hole = null;     // {lat,lng,rMeters}

  const REVEAL_RADIUS_M = 90; // test radius so "around me" is clearly visible

  // Wait for DOM and map to exist, then wire up
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('exploreBtn');
    if (!btn) return; // no button, nothing to do

    // Wait until code.js exposes mapRef
    const waitForMap = setInterval(() => {
      if (window.mapRef) {
        clearInterval(waitForMap);
        map = window.mapRef;
        ensureCanvas();
        attachMapEvents();
        btn.addEventListener('click', toggleExplore);
      }
    }, 50);
  });

  function toggleExplore(){
    const btn = document.getElementById('exploreBtn');
    exploring = !exploring;
    if (btn){
      btn.dataset.active = String(exploring);
      btn.textContent = exploring ? 'Stop Explore' : 'Start Explore';
    }

    if (exploring) {
      // Start with a full fog and a single hole at current geolocation
      startWatch();
    } else {
      stopWatch();
      // Keep whatever is rendered; no auto-updates when stopped
    }
    render();
  }

  function startWatch(){
    // Immediately set hole around current user location (if available via map center)
    const c = map.getCenter();
    hole = { lat: c.lat, lng: c.lng, rMeters: REVEAL_RADIUS_M };
    render();

    if ('geolocation' in navigator) {
      stopWatch();
      watchId = navigator.geolocation.watchPosition(pos => {
        hole = { lat: pos.coords.latitude, lng: pos.coords.longitude, rMeters: REVEAL_RADIUS_M };
        render();
      }, () => {
        // On error, do nothing – keep last hole
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
    }
  }

  function stopWatch(){
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  function ensureCanvas(){
    if (canvas) return;
    const pane = map.getPanes().overlayPane;
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    pane.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resizeCanvas();
  }

  function attachMapEvents(){
    map.on('move zoom zoomend resize', () => {
      resizeCanvas();
      render();
    });
  }

  function resizeCanvas(){
    const size = map.getSize();
    if (!canvas) return;
    if (canvas.width !== size.x || canvas.height !== size.y){
      canvas.width = size.x;
      canvas.height = size.y;
    }
    // Keep canvas aligned with the map's top-left corner of the current view
    const topLeft = map.containerPointToLayerPoint([0,0]);
    L.DomUtil.setPosition(canvas, topLeft);
  }

  function metersToPixels(m){
    // Convert meters to pixels at current zoom near map center
    const center = map.getCenter();
    const ref1 = center;
    const ref2 = L.latLng(center.lat, center.lng + 0.001);
    const metersPerLng = map.distance(ref1, ref2);
    const pxPerLng = Math.abs(map.latLngToContainerPoint(ref2).x - map.latLngToContainerPoint(ref1).x);
    return (pxPerLng / metersPerLng) * m;
  }

  function render(){
    if (!ctx || !canvas) return;
    // Fill entire canvas with fog
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    if (hole) {
      // Punch a circular hole at the user's location
      const p = map.latLngToContainerPoint([hole.lat, hole.lng]);
      const rpx = metersToPixels(hole.rMeters);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(p.x, p.y, rpx, 0, Math.PI * 2);
      ctx.fill();
    }

    // reset comp op for safety
    ctx.globalCompositeOperation = 'source-over';
  }
})();
