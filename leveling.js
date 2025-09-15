(function(global){
  const STORAGE_KEY = 'leveling_progress';
  const titles = [
    'Sidewalk Scout',
    'Block Browser',
    'Alleyway Amateur',
    'Crosswalk Cadet',
    'Corner Cartographer',
    'Bus Stop Sleuth',
    'Backstreet Beginner',
    'Curbside Cruiser',
    'Laneway Lookout',
    'Neighborhood Novice',
    'District Drifter',
    'Park Path Prowler',
    'Avenue Adventurer',
    'Bikeway Buddy',
    'Transit Trailblazer',
    'Boulevard Breacher',
    'Skyline Surveyor',
    'Suburb Seeker',
    'Metro Mapmaker',
    'Urban Untangler',
    'Concrete Conqueror',
    'Waypoint Wrangler',
    'Perimeter Pioneer',
    'Gridline Groover',
    'Zoning Zealot',
    'Compass Collector',
    'Milepost Maverick',
    'Blockface Bard',
    'Streetlight Stalker',
    'Pavement Philosopher',
    'Traffic Tactician',
    'Median Magician',
    'Overpass Operative',
    'Underpass Unfolder',
    'Rooftop Rambler',
    'Corridor Chaser',
    'Parcel Pathfinder',
    'Latitude Lurker',
    'Longitude Lancer',
    'Boundary Breaker',
    'Wayfinding Whisperer',
    'Civic Circuit Scribe',
    'Arcade Analyst',
    'Esplanade Emissary',
    'Harbor Harbinger',
    'Canal Courier',
    'Causeway Curator',
    'Promenade Paladin',
    'Roundabout Rogue',
    'Switchback Savant',
    'Ferryline Forager',
    'Trailhead Tactician',
    'Lookout Laureate',
    'Vista Voyager',
    'Plateau Pacer',
    'Foothill Forerunner',
    'Ridgeline Ranger',
    'Compass Captain',
    'Sector Sentinel',
    'Ward Wayfarer',
    'Quarter Quester',
    'Borough Baron',
    'District Duke',
    'Precinct Prodigy',
    'Commons Champion',
    'Arcadia Archer',
    'Forum Frontiersman',
    'Atrium Aficionado',
    'Promontory Pathfinder',
    'Street Grid Sage',
    'Transit Titan',
    'Substrate Scholar',
    'Pylon Paladin',
    'Skybridge Skipper',
    'Concourse Commander',
    'Terminal Tactician',
    'Marquee Mapper',
    'Spire Surveyor',
    'Kernel Cartographer',
    'Topology Tinkerer',
    'Vector Vanguard',
    'Raster Ronin',
    'Tilelayer Tycoon',
    'Zoom-Level Zealot',
    'Viewport Vindicator',
    'Pan & Scan Paladin',
    'Frustum Forger',
    'Geofence General',
    'Buffer Bandit',
    'Polyline Prophet',
    'Polygon Paladin',
    'Centroid Sentinel',
    'Isochrone Illusionist',
    'Heatmap Herald',
    'Basemap Baron',
    'Overlay Overlord',
    'Legend Luminary',
    'Waypoint Warlock',
    'Urban Mythmaker',
    'Worldwalker'
  ];

  const XP_SCALE = 10000;
  let xp = 0;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      xp = Number(data.xp) || 0;
    }
  } catch (e) {
    xp = 0;
  }

  const progressCallbacks = [];
  const levelUpCallbacks = [];

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp }));
  }

  function xpToNext(level) {
    if (level <= 15) return 2 * level * XP_SCALE;
    if (level <= 30) return 5 * level * XP_SCALE;
    return 10 * level * XP_SCALE;
  }

  function calculate() {
    let level = 1;
    let remaining = xp;
    let required = xpToNext(level);
    while (remaining >= required) {
      remaining -= required;
      level++;
      required = xpToNext(level);
    }
    const percent = required ? (remaining / required) * 100 : 100;
    return { level, xpIntoLevel: remaining, xpForNext: required, percent };
  }

  function getTitle(level) {
    const index = Math.min(level, titles.length) - 1;
    return titles[index];
  }

  function addXP(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return getProgress();
    const beforeLevel = calculate().level;
    xp += amount;
    save();
    const prog = getProgress();
    progressCallbacks.forEach((cb) => cb(prog));
    for (let lvl = beforeLevel + 1; lvl <= prog.level; lvl++) {
      levelUpCallbacks.forEach((cb) => cb(lvl, getTitle(lvl)));
    }
    return prog;
  }

  function getProgress() {
    const { level, xpIntoLevel, xpForNext, percent } = calculate();
    return {
      level,
      xp: xpIntoLevel,
      required: xpForNext,
      percent,
      title: getTitle(level)
    };
  }

  function reset() {
    xp = 0;
    save();
    const prog = getProgress();
    progressCallbacks.forEach((cb) => cb(prog));
  }

  function exportState() {
    return JSON.stringify({ xp });
  }

  function importState(data) {
    try {
      const obj = JSON.parse(data);
      xp = Number(obj.xp) || 0;
      save();
      const prog = getProgress();
      progressCallbacks.forEach((cb) => cb(prog));
    } catch (e) {
      /* ignore */
    }
  }

  function onProgress(cb) {
    if (typeof cb === 'function') progressCallbacks.push(cb);
  }

  function onLevelUp(cb) {
    if (typeof cb === 'function') levelUpCallbacks.push(cb);
  }

  global.LevelSystem = {
    addXP,
    getProgress,
    reset,
    export: exportState,
    import: importState,
    onProgress,
    onLevelUp
  };
})(window);

