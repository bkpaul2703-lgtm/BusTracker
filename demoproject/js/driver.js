/**
 * ==========================================================================
 * City Bus Tracker - Driver Dashboard & GPS Simulation (driver.js)
 * ==========================================================================
 * Manages:
 * - Active driver session (default: Rahul Sharma - D001)
 * - Trip lifecycle transitions (Scheduled -> Running -> Paused -> Completed)
 * - Simulated Driver Phone GPS Engine: steps along ordered route stops,
 *   updates current/next stop, coordinates, speed, and telemetry bar.
 * - Mini Leaflet map tracking the driver's vehicle in real time.
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // State
  let currentDriverId = 'D001';
  let tripStatus = 'Scheduled'; // 'Scheduled', 'Running', 'Paused', 'Completed'
  let currentStopIndex = 0;
  let gpsInterval = null;
  let driverMap = null;
  let driverBusMarker = null;
  let routePolyline = null;
  let simulatedSpeed = 0;
  let tripStartTime = null;

  // DOM Elements
  const driverSelect = document.getElementById('driverProfileSelect');
  const driverNameEl = document.getElementById('driverName');
  const driverIdEl = document.getElementById('driverId');
  const driverPhoneEl = document.getElementById('driverPhone');
  const driverLicenseEl = document.getElementById('driverLicense');
  const assignedBusEl = document.getElementById('assignedBus');
  const assignedRouteEl = document.getElementById('assignedRoute');
  const tripStatusBadge = document.getElementById('tripStatusBadge');
  const currentStopEl = document.getElementById('driverCurrentStop');
  const nextStopEl = document.getElementById('driverNextStop');
  const gpsLatEl = document.getElementById('gpsLatitude');
  const gpsLngEl = document.getElementById('gpsLongitude');
  const gpsSpeedEl = document.getElementById('gpsSpeed');
  const progressBar = document.getElementById('tripProgressBar');
  const progressText = document.getElementById('tripProgressText');
  const stopsListContainer = document.getElementById('driverRouteStopsList');

  // Control Buttons
  const startBtn = document.getElementById('startTripBtn');
  const pauseBtn = document.getElementById('pauseTripBtn');
  const resumeBtn = document.getElementById('resumeTripBtn');
  const endBtn = document.getElementById('endTripBtn');

  // Initialize
  initDriverSelector();
  loadDriverData();
  setupEventListeners();

  // 1. Populate Driver Selection Dropdown
  function initDriverSelector() {
    if (!driverSelect) return;
    const drivers = window.CityBusData.getDrivers();
    driverSelect.innerHTML = '';
    drivers.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `${d.name} (${d.id}) - Bus ${d.busId}`;
      driverSelect.appendChild(opt);
    });

    driverSelect.value = currentDriverId;
    driverSelect.addEventListener('change', function () {
      currentDriverId = driverSelect.value;
      resetTripState();
      loadDriverData();
    });
  }

  // 2. Load Driver & Route Information
  function loadDriverData() {
    const driver = window.CityBusData.getDriverById(currentDriverId);
    if (!driver) return;

    const bus = window.CityBusData.getBusById(driver.busId);
    const route = bus ? window.CityBusData.getRouteById(bus.routeId) : null;

    if (driverNameEl) driverNameEl.textContent = driver.name;
    if (driverIdEl) driverIdEl.textContent = driver.id;
    if (driverPhoneEl) driverPhoneEl.textContent = driver.phone;
    if (driverLicenseEl) driverLicenseEl.textContent = driver.license;

    if (assignedBusEl) {
      assignedBusEl.textContent = bus ? `${bus.number} (${bus.model})` : 'Unassigned';
    }

    if (assignedRouteEl) {
      assignedRouteEl.textContent = route ? `${route.number}: ${route.name}` : 'Unassigned';
    }

    renderOrderedStops(route);
    initDriverMap(bus, route);
    updateTripUI();
  }

  // 3. Render Ordered Stops Sequence in Driver View
  function renderOrderedStops(route) {
    if (!stopsListContainer || !route) return;
    stopsListContainer.innerHTML = '';

    route.stops.forEach((stopId, idx) => {
      const stop = window.CityBusData.getStopById(stopId);
      const isPassed = idx < currentStopIndex;
      const isCurrent = idx === currentStopIndex;
      const isUpcoming = idx > currentStopIndex;

      let badgeBg = '#64748b';
      let statusText = 'Upcoming';
      if (isPassed) {
        badgeBg = '#2563eb';
        statusText = 'Departed';
      } else if (isCurrent) {
        badgeBg = '#10b981';
        statusText = tripStatus === 'Running' ? 'Active / Arriving' : 'Current Terminal';
      }

      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 0.875rem;
        background: ${isCurrent ? '#ecfdf5' : '#ffffff'};
        border: 1px solid ${isCurrent ? '#a7f3d0' : 'var(--border-color)'};
        border-radius: var(--radius-md);
        margin-bottom: 0.5rem;
        transition: all 0.2s;
      `;

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${badgeBg}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">
            ${idx + 1}
          </div>
          <div>
            <strong style="color: #0f172a; font-size: 0.9375rem;">${stop ? stop.name : stopId}</strong>
            <div style="font-size: 0.75rem; color: #64748b;">${stop ? stop.landmark : ''}</div>
          </div>
        </div>
        <span style="font-size: 0.75rem; font-weight: 700; color: ${badgeBg};">
          ${statusText}
        </span>
      `;

      stopsListContainer.appendChild(row);
    });
  }

  // 4. Update UI Buttons & Badges based on Trip Status
  function updateTripUI() {
    const driver = window.CityBusData.getDriverById(currentDriverId);
    const bus = driver ? window.CityBusData.getBusById(driver.busId) : null;
    const route = bus ? window.CityBusData.getRouteById(bus.routeId) : null;

    if (!route) return;

    const stops = route.stops;
    const currentStop = window.CityBusData.getStopById(stops[currentStopIndex]);
    const nextStop = window.CityBusData.getStopById(stops[Math.min(currentStopIndex + 1, stops.length - 1)]);

    if (currentStopEl) currentStopEl.textContent = currentStop ? currentStop.name : 'Unknown';
    if (nextStopEl) {
      if (currentStopIndex >= stops.length - 1) {
        nextStopEl.textContent = 'Terminus Reached';
      } else {
        nextStopEl.textContent = nextStop ? nextStop.name : 'Terminus';
      }
    }

    // Telemetry progress
    const pct = Math.round((currentStopIndex / Math.max(1, stops.length - 1)) * 100);
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressText) progressText.textContent = `${pct}% Route Completed (${currentStopIndex + 1}/${stops.length} stops)`;

    if (gpsSpeedEl) gpsSpeedEl.textContent = `${simulatedSpeed} km/h`;
    if (currentStop) {
      if (gpsLatEl) gpsLatEl.textContent = currentStop.latitude.toFixed(4);
      if (gpsLngEl) gpsLngEl.textContent = currentStop.longitude.toFixed(4);
    }

    // Badge styling
    if (tripStatusBadge) {
      tripStatusBadge.className = 'status-badge';
      if (tripStatus === 'Running') {
        tripStatusBadge.classList.add('live');
        tripStatusBadge.innerHTML = `<span class="pulse-dot"></span> RUNNING`;
      } else if (tripStatus === 'Paused') {
        tripStatusBadge.classList.add('stopped');
        tripStatusBadge.textContent = '⏸️ PAUSED';
      } else if (tripStatus === 'Completed') {
        tripStatusBadge.classList.add('offline');
        tripStatusBadge.textContent = '🏁 COMPLETED';
      } else {
        tripStatusBadge.classList.add('moving');
        tripStatusBadge.textContent = '🕒 SCHEDULED';
      }
    }

    // Button states
    if (startBtn) startBtn.style.display = tripStatus === 'Scheduled' ? 'inline-flex' : 'none';
    if (pauseBtn) pauseBtn.style.display = tripStatus === 'Running' ? 'inline-flex' : 'none';
    if (resumeBtn) resumeBtn.style.display = tripStatus === 'Paused' ? 'inline-flex' : 'none';
    if (endBtn) endBtn.style.display = (tripStatus === 'Running' || tripStatus === 'Paused') ? 'inline-flex' : 'none';
  }

  // 5. Trip Lifecycle Event Listeners
  function setupEventListeners() {
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        tripStatus = 'Running';
        tripStartTime = new Date();
        simulatedSpeed = 28;
        startGpsSimulationLoop();
        updateTripUI();
        notifyStateChange('Trip Started! GPS signal transmitting mock coordinates.');
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        tripStatus = 'Paused';
        simulatedSpeed = 0;
        clearInterval(gpsInterval);
        updateTripUI();
        notifyStateChange('Trip Paused. Vehicle stopped.');
      });
    }

    if (resumeBtn) {
      resumeBtn.addEventListener('click', function () {
        tripStatus = 'Running';
        simulatedSpeed = 26;
        startGpsSimulationLoop();
        updateTripUI();
        notifyStateChange('Trip Resumed. Resuming GPS transmission.');
      });
    }

    if (endBtn) {
      endBtn.addEventListener('click', function () {
        tripStatus = 'Completed';
        simulatedSpeed = 0;
        clearInterval(gpsInterval);
        updateTripUI();
        notifyStateChange('Trip Ended. Route completed.');
      });
    }
  }

  // 6. Reset Trip State
  function resetTripState() {
    clearInterval(gpsInterval);
    tripStatus = 'Scheduled';
    currentStopIndex = 0;
    simulatedSpeed = 0;
  }

  // 7. Simulated GPS Transmission Loop
  // Simulates the driver's phone sending location to backend every 3.5s
  function startGpsSimulationLoop() {
    clearInterval(gpsInterval);

    gpsInterval = setInterval(function () {
      if (tripStatus !== 'Running') return;

      const driver = window.CityBusData.getDriverById(currentDriverId);
      const bus = driver ? window.CityBusData.getBusById(driver.busId) : null;
      const route = bus ? window.CityBusData.getRouteById(bus.routeId) : null;

      if (!route) return;

      // Advance stop
      if (currentStopIndex < route.stops.length - 1) {
        currentStopIndex++;
      } else {
        // Reached end of line!
        tripStatus = 'Completed';
        simulatedSpeed = 0;
        clearInterval(gpsInterval);
        notifyStateChange('Final destination reached! Trip completed.');
      }

      simulatedSpeed = Math.floor(22 + Math.random() * 12);

      // Synchronize driver mock bus state in global store so Passenger map can reflect it!
      if (bus) {
        const activeStopId = route.stops[currentStopIndex];
        const nextStopId = route.stops[Math.min(currentStopIndex + 1, route.stops.length - 1)];
        window.CityBusData.updateBus(bus.id, {
          currentStopId: activeStopId,
          nextStopId: nextStopId,
          speedKmH: simulatedSpeed,
          status: tripStatus === 'Running' ? 'Live' : 'Stopped'
        });
      }

      // Refresh driver UI & marker
      const currentStop = window.CityBusData.getStopById(route.stops[currentStopIndex]);
      if (currentStop && driverBusMarker) {
        driverBusMarker.setLatLng([currentStop.latitude, currentStop.longitude]);
        driverMap.panTo([currentStop.latitude, currentStop.longitude]);
      }

      renderOrderedStops(route);
      updateTripUI();
    }, 3500);
  }

  // 8. Initialize Driver Map
  function initDriverMap(bus, route) {
    const mapEl = document.getElementById('driverMiniMap');
    if (!mapEl || typeof L === 'undefined') return;

    if (!driverMap) {
      driverMap = L.map('driverMiniMap', {
        zoomControl: false
      }).setView([26.1550, 91.7450], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap'
      }).addTo(driverMap);
    }

    // Clean prior layers
    if (routePolyline) driverMap.removeLayer(routePolyline);
    if (driverBusMarker) driverMap.removeLayer(driverBusMarker);

    if (route) {
      const waypoints = window.CityBusData.getRouteWaypoints(route.id);
      if (waypoints && waypoints.length > 0) {
        routePolyline = L.polyline(waypoints, {
          color: route.color || '#2563eb',
          weight: 4,
          opacity: 0.8
        }).addTo(driverMap);

        driverMap.fitBounds(routePolyline.getBounds().pad(0.1));
      }

      // Add bus icon
      const busIcon = L.divIcon({
        className: 'driver-map-bus-icon',
        html: `<div style="background:#059669; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.3); font-size:16px;">🚌</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const initialStop = window.CityBusData.getStopById(route.stops[currentStopIndex]);
      const initialCoords = initialStop ? [initialStop.latitude, initialStop.longitude] : [26.1550, 91.7450];

      driverBusMarker = L.marker(initialCoords, { icon: busIcon }).addTo(driverMap);
    }
  }

  // Helper: Flash message banner
  function notifyStateChange(msg) {
    const banner = document.getElementById('driverNotificationBanner');
    if (!banner) return;
    banner.textContent = msg;
    banner.style.display = 'block';
    setTimeout(() => {
      banner.style.display = 'none';
    }, 4000);
  }
});
