/**
 * ==========================================================================
 * City Bus Tracker - Admin Live Buses Telemetry (admin-live-buses.js)
 * ==========================================================================
 * - Displays interactive Leaflet map of all operating buses in the city
 * - Live fleet telemetry table updating in real time
 * - Filter active fleet by route
 * - Center map on specific bus
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const mapEl = document.getElementById('adminLiveMap');
  const tableBody = document.getElementById('adminLiveTableBody');
  if (!mapEl || !tableBody) return;

  let map;
  let markers = {};
  let routeLines = {};
  let liveTimer = null;

  // 1. Initialize Map
  function initMap() {
    map = L.map('adminLiveMap').setView([26.1550, 91.7450], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    renderRoutePolylines();
    renderStops();
    initBusMarkers();
    renderLiveTable();

    // Start live refresh loop every 3 seconds
    liveTimer = setInterval(function () {
      refreshFleetTelemetry();
    }, 3000);
  }

  // 2. Render Route Lines
  function renderRoutePolylines() {
    window.CityBusData.getRoutes().forEach(r => {
      const waypoints = window.CityBusData.getRouteWaypoints(r.id);
      if (waypoints && waypoints.length > 0) {
        const line = L.polyline(waypoints, {
          color: r.color || '#2563eb',
          weight: 4,
          opacity: 0.65
        }).addTo(map);
        routeLines[r.id] = line;
      }
    });
  }

  // 3. Render Stops
  function renderStops() {
    window.CityBusData.getStops().forEach(s => {
      L.circleMarker([s.latitude, s.longitude], {
        radius: 4,
        color: '#64748b',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2
      }).addTo(map).bindTooltip(s.name, { direction: 'top' });
    });
  }

  // 4. Initialize Bus Markers
  function initBusMarkers() {
    const buses = window.CityBusData.getBuses();

    buses.forEach(b => {
      const waypoints = window.CityBusData.getRouteWaypoints(b.routeId);
      const coords = waypoints[b.currentWaypointIndex % (waypoints.length || 1)] || [26.1550, 91.7450];

      const icon = L.divIcon({
        className: 'admin-bus-icon',
        html: `<div style="background:#2563eb; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.35); font-size:14px;">🚌</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker(coords, { icon: icon }).addTo(map);
      marker.bindPopup(`<strong>${b.number}</strong><br>Route: ${b.routeId}<br>Status: ${b.status}`);
      markers[b.id] = marker;
    });
  }

  // 5. Render Live Fleet Table
  function renderLiveTable() {
    const buses = window.CityBusData.getBuses();
    tableBody.innerHTML = '';

    buses.forEach(b => {
      const route = window.CityBusData.getRouteById(b.routeId);
      const driver = window.CityBusData.getDriverById(b.driverId);
      const currentStop = window.BusApp.getStopName(b.currentStopId);
      const nextStop = window.BusApp.getStopName(b.nextStopId);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--primary-700);">${b.id}</strong></td>
        <td><strong>${b.number}</strong></td>
        <td>${route ? `<span style="font-weight:600;">${route.number}</span>` : 'Unassigned'}</td>
        <td>${driver ? driver.name : 'Unassigned'}</td>
        <td><strong style="color: var(--primary-700);">${currentStop}</strong></td>
        <td>${nextStop}</td>
        <td>${b.speedKmH} km/h</td>
        <td>
          <span class="status-badge live">
            <span class="pulse-dot"></span> ${b.status}
          </span>
        </td>
        <td>
          <button type="button" class="btn btn-secondary btn-sm focus-bus-btn" data-id="${b.id}">
            🎯 Center Map
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    document.querySelectorAll('.focus-bus-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const marker = markers[id];
        if (marker) {
          map.setView(marker.getLatLng(), 15, { animate: true });
          marker.openPopup();
        }
      });
    });
  }

  // 6. Refresh Telemetry Simulation
  function refreshFleetTelemetry() {
    const buses = window.CityBusData.getBuses();

    buses.forEach(b => {
      const waypoints = window.CityBusData.getRouteWaypoints(b.routeId);
      if (waypoints && waypoints.length > 0) {
        b.currentWaypointIndex = (b.currentWaypointIndex + 1) % waypoints.length;
        const newCoords = waypoints[b.currentWaypointIndex];

        if (markers[b.id] && newCoords) {
          markers[b.id].setLatLng(newCoords);
        }

        b.speedKmH = Math.floor(20 + Math.random() * 14);
        window.CityBusData.updateBus(b.id, {
          currentWaypointIndex: b.currentWaypointIndex,
          speedKmH: b.speedKmH
        });
      }
    });

    renderLiveTable();
  }

  initMap();
});
