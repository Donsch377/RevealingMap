# Revealing Map

## Project Overview and Purpose
Revealing Map is a lightweight web experience that overlays a fog-of-war on top of a familiar street map so people have a playful nudge to explore their surroundings. By gradually uncovering the map as you move, it encourages players to venture into new neighborhoods and experience the world beyond their usual routes.

## Features and Functionality
- Revealing map to get people to explore their world, built with Leaflet tiles and a custom fog canvas.
- Uses the browser's geolocation API to track movement and reveal circular areas in real time.
- Persistent progress through localStorage so uncovered territory and experience points survive page reloads.
- Level indicator that reacts to exploration progress with animated feedback on level ups.

## Known Issues or Limitations
- Requires secure contexts (HTTPS) and user consent for geolocation; the app cannot function without accurate GPS data.
- Mobile browsers may throttle background geolocation updates, which can slow down progress tracking.
- LocalStorage persistence is device-specific, so progress does not sync across browsers or devices.

## Future Enhancement Ideas
If I had more time I would build a stronger leveling system with more rewards and milestones. I would also add a badge system tied to real world locations. For example a player could get a badge for reaching the highest point in the United States. Ideally there would be badges generated automatically all around the world so players always have something new to discover.
