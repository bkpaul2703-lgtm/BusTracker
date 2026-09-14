/**
 * ==========================================================================
 * City Bus Tracker - Interactive Leaflet Map & Simulated GPS (live-map.js)
 * ==========================================================================
 * - Initializes Leaflet OpenStreetMap instance
 * - Renders route polylines
 * - Renders bus stop markers with informational popups
 * - Renders live bus markers with pulse effect
 * - GPS Simulation Engine: Automatically moves buses along route waypoints
 *   every 3 seconds. Clearly isolated so it can be swapped with Socket.IO/REST.
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Map elements
  const mapElement = document.getElementById('cityMap');
  if (!mapElement) return;

  // Global map state
  let map;
  let busMarkers = {};
  let stopMarkers = {};
  let routePolylines = {};
  let simulationInterval = null;
  let isSimulating = true;

  // Simulation state: bus coordinates progress index
  // Each bus maintains an internal waypoint index and direction (forward/backward along the route)
  const busSimState = {};

  // 1. Initialize Leaflet Map
  function initMap() {
    // Center initially on Guwahati transit corridor (Lat: 26.158, Lng: 91.750)
    map = L.map('cityMap', {
      zoomControl: true,
      attributionControl: true
    }).setView([26.1550, 91.7450], 13);

    // Add OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Render Routes & Stops
    renderRoutes();
    renderStops();
    initBusMarkers();

    // Start simulated GPS engine
    startGpsSimulation();

    // Setup UI Controls
    setupMapControls();

    // Handle URL parameters (e.g., focused bus or route)
    handleUrlParams();
  }

  // 2. Custom Icons for Leaflet
  function createBusIcon(busNumber) {
    return L.divIcon({
      className: 'custom-bus-marker',
      html: `
        <div class="bus-marker-pin" title="${busNumber}">
          <span class="bus-marker-icon">🚌</span>
          <span class="bus-marker-label">${busNumber}</span>
          <span class="bus-marker-pulse"></span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22]
    });
  }

  function createStopIcon(stopName) {
    return L.divIcon({
      className: 'custom-stop-marker',
      html: `
        <div class="stop-marker-dot" title="${stopName}">
          <div class="stop-marker-inner"></div>
        </div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10]
    });
  }

  // 3. Render Route Polylines
  function renderRoutes() {
    const routes = window.CityBusData.getRoutes();

    routes.forEach(route => {
      const waypoints = window.CityBusData.getRouteWaypoints(route.id);
      if (waypoints && waypoints.length > 0) {
        const polyline = L.polyline(waypoints, {
          color: route.color || '#2563eb',
          weight: 5,
          opacity: 0.75,
          lineJoin: 'round'
        }).addTo(map);

        polyline.bindTooltip(`<strong>${route.number}</strong>: ${route.name}`, {
          sticky: true,
          className: 'route-tooltip'
        });

        routePolylines[route.id] = polyline;
      }
    });
  }

  // 4. Render All Bus Stops
  function renderStops() {
    const stops = window.CityBusData.getStops();

    stops.forEach(stop => {
      const marker = L.marker([stop.latitude, stop.longitude], {
        icon: createStopIcon(stop.name)
      }).addTo(map);

      // Popup with stop details and routes serving it
      const servingRoutes = window.CityBusData.getRoutes().filter(r => r.stops.includes(stop.id));
      const routesListHtml = servingRoutes.map(r => 
        `<span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:0.75rem; background-color:${r.color}; color:#fff; margin-right:4px;">${r.number}</span>`
      ).join('');

      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 180px;">
          <h4 style="margin: 0 0 4px 0; color: #0f172a; font-size: 1rem;">🚏 ${stop.name}</h4>
          <p style="margin: 0 0 8px 0; font-size: 0.8rem; color: #64748b;">${stop.landmark}</p>
          <div style="font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Routes Serving this Stop:</div>
          <div>${routesListHtml}</div>
        </div>
      `);

      stopMarkers[stop.id] = marker;
    });
  }

  // 5. Initialize Live Bus Markers
  function initBusMarkers() {
    const buses = window.CityBusData.getBuses();

    buses.forEach(bus => {
      const routeWaypoints = window.CityBusData.getRouteWaypoints(bus.routeId);
      const initialWaypointIdx = bus.currentWaypointIndex % (routeWaypoints.length || 1);
      const coords = routeWaypoints[initialWaypointIdx] || [26.1542, 91.6621];

      // Save simulation tracking state
      busSimState[bus.id] = {
        busId: bus.id,
        routeId: bus.routeId,
        waypointIndex: initialWaypointIdx,
        direction: 1, // 1: moving forward, -1: reversing back
        speedKmH: bus.speedKmH,
        currentStopId: bus.currentStopId,
        nextStopId: bus.nextStopId
      };

      const marker = L.marker(coords, {
        icon: createBusIcon(bus.number)
      }).addTo(map);

      updateBusPopup(marker, bus);
      busMarkers[bus.id] = marker;
    });

    updateBusListSidebar();
  }

  // Generate HTML for Bus Popup
  function updateBusPopup(marker, bus) {
    const route = window.CityBusData.getRouteById(bus.routeId);
    const currentStopName = window.BusApp.getStopName(bus.currentStopId);
    const nextStopName = window.BusApp.getStopName(bus.nextStopId);

    const popupHtml = `
      <div style="font-family: inherit; min-width: 210px; line-height: 1.4;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <h4 style="margin: 0; font-size: 1.05rem; color: #0f172a;">🚌 ${bus.number}</h4>
          <span style="font-size: 0.7rem; font-weight: 700; color: #059669; background: #ecfdf5; padding: 2px 6px; border-radius: 99px;">
            ● ${bus.status}
          </span>
        </div>
        <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 8px;">
          ${route ? `${route.number} (${route.name})` : ''}
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px; font-size: 0.8125rem; margin-bottom: 8px; border: 1px solid #e2e8f0;">
          <div><span style="color: #64748b;">Current:</span> <strong>${currentStopName}</strong></div>
          <div style="margin-top: 3px;"><span style="color: #64748b;">Next Stop:</span> <strong>${nextStopName}</strong></div>
          <div style="margin-top: 3px;"><span style="color: #64748b;">Speed:</span> <strong>${bus.speedKmH} km/h</strong></div>
        </div>
        <a href="bus-details.html?busId=${bus.id}" style="display: block; text-align: center; background: #2563eb; color: #fff; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8125rem; font-weight: 600;">
          Inspect Bus Details ➔
        </a>
      </div>
    `;

    marker.bindPopup(popupHtml);
  }

  // 6. GPS Simulation Engine (Frontend Mock)
  // In production, this interval will be replaced with real GPS coordinates pushed via WebSockets (e.g., Socket.IO)
  function startGpsSimulation() {
    if (simulationInterval) clearInterval(simulationInterval);

    simulationInterval = setInterval(function () {
      if (!isSimulating) return;

      const buses = window.CityBusData.getBuses();

      buses.forEach(bus => {
        const state = busSimState[bus.id];
        if (!state) return;

        const waypoints = window.CityBusData.getRouteWaypoints(state.routeId);
        if (!waypoints || waypoints.length === 0) return;

        // Advance along waypoints
        state.waypointIndex += state.direction;

        // Bounce back if reached terminus
        if (state.waypointIndex >= waypoints.length - 1) {
          state.waypointIndex = waypoints.length - 1;
          state.direction = -1;
        } else if (state.waypointIndex <= 0) {
          state.waypointIndex = 0;
          state.direction = 1;
        }

        const newPos = waypoints[state.waypointIndex];
        const marker = busMarkers[bus.id];

        if (marker && newPos) {
          marker.setLatLng(newPos);

          // Update stops based on proximity to nearest stop
          updateNearestStop(state, newPos);

          // Refresh bus popup with new live data
          bus.speedKmH = Math.floor(22 + Math.random() * 12);
          bus.currentStopId = state.currentStopId;
          bus.nextStopId = state.nextStopId;
          updateBusPopup(marker, bus);
        }
      });

      // Update sidebar bus items if visible
      updateBusListSidebar();
    }, 3000); // Ticks every 3 seconds
  }

  // Helper: Determine closest stop to simulated coordinates
  function updateNearestStop(simState, currentCoords) {
    const route = window.CityBusData.getRouteById(simState.routeId);
    if (!route) return;

    let closestStop = null;
    let minDistance = Infinity;

    route.stops.forEach((stopId, index) => {
      const stop = window.CityBusData.getStopById(stopId);
      if (stop) {
        const dLat = stop.latitude - currentCoords[0];
        const dLng = stop.longitude - currentCoords[1];
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);

        if (dist < minDistance) {
          minDistance = dist;
          closestStop = { stop, index };
        }
      }
    });

    if (closestStop) {
      simState.currentStopId = closestStop.stop.id;
      // Next stop is the next in route sequence
      const nextIdx = (closestStop.index + simState.direction + route.stops.length) % route.stops.length;
      simState.nextStopId = route.stops[nextIdx];
    }
  }

  // 7. Update Live Bus List Cards on the Side Rail
  function updateBusListSidebar() {
    const container = document.getElementById('liveBusSidebarList');
    if (!container) return;

    const buses = window.CityBusData.getBuses();
    container.innerHTML = '';

    buses.forEach(bus => {
      const route = window.CityBusData.getRouteById(bus.routeId);
      const currentStop = window.BusApp.getStopName(bus.currentStopId);
      const nextStop = window.BusApp.getStopName(bus.nextStopId);

      const item = document.createElement('div');
      item.className = 'live-bus-item';
      item.style.cssText = `
        padding: 0.875rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        margin-bottom: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
      `;

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: #0f172a; font-size: 0.95rem;">🚌 ${bus.number}</strong>
          <span style="font-size: 0.7rem; font-weight: 700; color: #059669; background: #ecfdf5; padding: 2px 6px; border-radius: 99px;">
            ● LIVE
          </span>
        </div>
        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 6px;">
          ${route ? route.name : ''}
        </div>
        <div style="font-size: 0.8rem; color: #334155;">
          <span>Near: <strong>${currentStop}</strong></span> ➔ <span>Next: <strong>${nextStop}</strong></span>
        </div>
      `;

      // Click to focus map on this bus
      item.addEventListener('click', function () {
        focusOnBus(bus.id);
      });

      container.appendChild(item);
    });
  }

  // 8. Focus Map on a Specific Bus
  function focusOnBus(busId) {
    const marker = busMarkers[busId];
    if (marker) {
      map.setView(marker.getLatLng(), 15, { animate: true });
      marker.openPopup();
    }
  }

  // 9. Setup Interactive Controls
  function setupMapControls() {
    // Route filter selector
    const routeFilter = document.getElementById('mapRouteFilter');
    if (routeFilter) {
      const routes = window.CityBusData.getRoutes();
      routeFilter.innerHTML = '<option value="ALL">All City Routes</option>';
      routes.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `${r.number}: ${r.name}`;
        routeFilter.appendChild(opt);
      });

      routeFilter.addEventListener('change', function () {
        const selectedRoute = routeFilter.value;
        Object.keys(routePolylines).forEach(routeId => {
          if (selectedRoute === 'ALL' || selectedRoute === routeId) {
            map.addLayer(routePolylines[routeId]);
          } else {
            map.removeLayer(routePolylines[routeId]);
          }
        });

        // Filter bus markers by route
        const buses = window.CityBusData.getBuses();
        buses.forEach(b => {
          const marker = busMarkers[b.id];
          if (marker) {
            if (selectedRoute === 'ALL' || b.routeId === selectedRoute) {
              map.addLayer(marker);
            } else {
              map.removeLayer(marker);
            }
          }
        });
      });
    }

    // Play/Pause simulation toggle
    const simToggleBtn = document.getElementById('toggleSimulationBtn');
    if (simToggleBtn) {
      simToggleBtn.addEventListener('click', function () {
        isSimulating = !isSimulating;
        simToggleBtn.innerHTML = isSimulating ? '⏸️ Pause GPS Simulation' : '▶️ Resume GPS Simulation';
        simToggleBtn.className = isSimulating ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm';
      });
    }

    // Center all bounds button
    const centerBoundsBtn = document.getElementById('centerBoundsBtn');
    if (centerBoundsBtn) {
      centerBoundsBtn.addEventListener('click', function () {
        const group = new L.featureGroup(Object.values(busMarkers));
        map.fitBounds(group.getBounds().pad(0.2));
      });
    }
  }

  // 10. Handle URL Query Params (e.g., live-map.html?busId=B001)
  function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const busId = urlParams.get('busId');
    const routeId = urlParams.get('routeId');

    if (routeId) {
      const filter = document.getElementById('mapRouteFilter');
      if (filter) {
        filter.value = routeId;
        filter.dispatchEvent(new Event('change'));
      }
    }

    if (busId) {
      setTimeout(() => {
        focusOnBus(busId);
      }, 500);
    }
  }

  // Initialize Map
  initMap();
});
