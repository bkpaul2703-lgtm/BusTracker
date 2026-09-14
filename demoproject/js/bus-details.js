/**
 * ==========================================================================
 * City Bus Tracker - Bus Details & Route Timeline (bus-details.js)
 * ==========================================================================
 * - Extracts busId from URL query parameters (default: 'B001')
 * - Displays bus specifications, live status, current & next stop
 * - Renders ordered vertical timeline of all stops (Passed, Current, Upcoming)
 * - Renders a synchronized mini Leaflet map focusing on the selected bus
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Check if we are on the bus details page
  const detailsContainer = document.getElementById('busDetailsContainer');
  if (!detailsContainer) return;

  // 1. Get busId from URL parameters or fallback to default
  const urlParams = new URLSearchParams(window.location.search);
  const busId = urlParams.get('busId') || 'B001';

  const bus = window.CityBusData.getBusById(busId);
  if (!bus) {
    renderNotFound();
    return;
  }

  const route = window.CityBusData.getRouteById(bus.routeId);

  // Initialize page components
  renderBusHeader(bus, route);
  renderBusMetrics(bus);
  renderStopTimeline(bus, route);
  initMiniMap(bus, route);

  // 2. Render Header with Bus Title & Status
  function renderBusHeader(bus, route) {
    const titleEl = document.getElementById('busDetailTitle');
    const badgeEl = document.getElementById('busDetailStatus');
    const routeNameEl = document.getElementById('busDetailRouteName');

    if (titleEl) titleEl.textContent = `${bus.number} (${bus.model})`;
    if (badgeEl) {
      badgeEl.className = 'status-badge live';
      badgeEl.innerHTML = `<span class="pulse-dot"></span> ${bus.status}`;
    }
    if (routeNameEl) {
      routeNameEl.textContent = `${route.number}: ${route.name}`;
    }
  }

  // 3. Render Bus Specifications & Real-time Metrics
  function renderBusMetrics(bus) {
    const currentStop = window.BusApp.getStopName(bus.currentStopId);
    const nextStop = window.BusApp.getStopName(bus.nextStopId);

    const elCurrent = document.getElementById('metricCurrentStop');
    const elNext = document.getElementById('metricNextStop');
    const elSpeed = document.getElementById('metricSpeed');
    const elReg = document.getElementById('metricRegNo');
    const elOccupancy = document.getElementById('metricOccupancy');
    const elDriver = document.getElementById('metricDriver');

    if (elCurrent) elCurrent.textContent = currentStop;
    if (elNext) elNext.textContent = nextStop;
    if (elSpeed) elSpeed.textContent = `${bus.speedKmH} km/h`;
    if (elReg) elReg.textContent = bus.regNumber;
    if (elOccupancy) elOccupancy.textContent = `${bus.occupancy} (${bus.capacity} seats)`;
    if (elDriver) elDriver.textContent = bus.driverName;
  }

  // 4. Render Ordered Stops Timeline
  function renderStopTimeline(bus, route) {
    const timelineEl = document.getElementById('stopsTimelineList');
    if (!timelineEl) return;

    timelineEl.innerHTML = '';

    const stops = route.stops;
    const currentIdx = stops.indexOf(bus.currentStopId);

    stops.forEach((stopId, index) => {
      const stop = window.CityBusData.getStopById(stopId);
      if (!stop) return;

      let stateClass = 'upcoming';
      let stateLabel = 'Upcoming';
      let markerIcon = `${index + 1}`;

      if (index < currentIdx) {
        stateClass = 'passed';
        stateLabel = 'Departed';
        markerIcon = '✓';
      } else if (index === currentIdx) {
        stateClass = 'current';
        stateLabel = 'Arriving / At Stop';
        markerIcon = '●';
      }

      const item = document.createElement('div');
      item.className = `timeline-item ${stateClass}`;
      item.innerHTML = `
        <div class="timeline-marker">${markerIcon}</div>
        <div class="timeline-title">${stop.name}</div>
        <div class="timeline-subtitle">${stop.landmark} • <span style="font-weight: 600;">${stateLabel}</span></div>
      `;

      timelineEl.appendChild(item);
    });
  }

  // 5. Initialize Mini Leaflet Map
  function initMiniMap(bus, route) {
    const miniMapEl = document.getElementById('miniMap');
    if (!miniMapEl || typeof L === 'undefined') return;

    const waypoints = window.CityBusData.getRouteWaypoints(route.id);
    const busCoord = waypoints[bus.currentWaypointIndex] || [26.1580, 91.7450];

    const miniMap = L.map('miniMap', {
      zoomControl: false,
      attributionControl: false
    }).setView(busCoord, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(miniMap);

    // Draw route line
    if (waypoints.length > 0) {
      L.polyline(waypoints, {
        color: route.color || '#2563eb',
        weight: 4,
        opacity: 0.8
      }).addTo(miniMap);
    }

    // Add Stop markers along the route
    route.stops.forEach(stopId => {
      const stop = window.CityBusData.getStopById(stopId);
      if (stop) {
        L.circleMarker([stop.latitude, stop.longitude], {
          radius: 6,
          fillColor: '#ffffff',
          color: '#2563eb',
          weight: 2,
          fillOpacity: 1
        }).addTo(miniMap).bindPopup(`<strong>${stop.name}</strong>`);
      }
    });

    // Add Bus Marker
    const busIcon = L.divIcon({
      className: 'mini-bus-marker',
      html: `<div style="background:#2563eb; color:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(37,99,235,0.6); font-size:16px;">🚌</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker(busCoord, { icon: busIcon }).addTo(miniMap);
    marker.bindPopup(`<strong>${bus.number}</strong><br>Status: ${bus.status}`).openPopup();
  }

  // 6. Handle Bus Not Found
  function renderNotFound() {
    detailsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3 class="empty-state-title">Bus Not Found</h3>
        <p class="empty-state-desc">The requested bus ID "${busId}" does not exist in our active schedule.</p>
        <a href="../index.html" class="btn btn-primary" style="margin-top: 1rem;">Back to Bus Search</a>
      </div>
    `;
  }
});
