/**
 * ==========================================================================
 * City Bus Tracker - Bus Search & Route Matching Logic (search.js)
 * ==========================================================================
 * Handles:
 * - Populating boarding and destination dropdowns with city stops
 * - Swapping boarding and destination stops
 * - Strict ordered route validation (Boarding Stop must occur before Destination Stop)
 * - Simulated API loading spinner
 * - Rendering matching bus cards with live status, route, and stop information
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // DOM Elements
  const boardingSelect = document.getElementById('boardingStopSelect');
  const destinationSelect = document.getElementById('destinationStopSelect');
  const searchBtn = document.getElementById('findBusesBtn');
  const swapBtn = document.getElementById('swapStopsBtn');
  const resultsContainer = document.getElementById('searchResultsContainer');
  const messageContainer = document.getElementById('searchMessageContainer');

  // If search controls don't exist on this page, exit gracefully
  if (!boardingSelect || !destinationSelect || !searchBtn) return;

  // 1. Populate Dropdowns with City Stops
  function populateStopDropdowns() {
    const stops = window.CityBusData.getStops();

    // Default placeholder options
    boardingSelect.innerHTML = '<option value="">-- Select Boarding Stop --</option>';
    destinationSelect.innerHTML = '<option value="">-- Select Destination Stop --</option>';

    stops.forEach(stop => {
      const optionA = document.createElement('option');
      optionA.value = stop.id;
      optionA.textContent = `${stop.name} (${stop.landmark})`;
      boardingSelect.appendChild(optionA);

      const optionB = document.createElement('option');
      optionB.value = stop.id;
      optionB.textContent = `${stop.name} (${stop.landmark})`;
      destinationSelect.appendChild(optionB);
    });

    // Check URL parameters for pre-selected stops (e.g., clicked from Profile recent searches)
    const urlParams = new URLSearchParams(window.location.search);
    const originParam = urlParams.get('origin');
    const destParam = urlParams.get('dest');

    if (originParam && destParam) {
      boardingSelect.value = originParam;
      destinationSelect.value = destParam;
      // Auto-trigger search
      handleBusSearch();
    }
  }

  // 2. Swap Boarding and Destination Stops
  if (swapBtn) {
    swapBtn.addEventListener('click', function () {
      const tempVal = boardingSelect.value;
      boardingSelect.value = destinationSelect.value;
      destinationSelect.value = tempVal;

      // Clear any prior error message
      clearMessage();

      // If both stops are selected after swap, trigger search automatically
      if (boardingSelect.value && destinationSelect.value) {
        handleBusSearch();
      }
    });
  }

  // 3. User Messages and Alert Helpers
  function showMessage(type, title, description) {
    if (!messageContainer) return;
    const alertClass = type === 'error' ? 'alert-error' : 'alert-info';
    const icon = type === 'error' ? '⚠️' : 'ℹ️';

    messageContainer.innerHTML = `
      <div class="alert ${alertClass}" role="alert">
        <span style="font-size: 1.25rem;">${icon}</span>
        <div>
          <strong>${title}</strong>
          <div>${description}</div>
        </div>
      </div>
    `;
  }

  function clearMessage() {
    if (messageContainer) {
      messageContainer.innerHTML = '';
    }
  }

  // 4. Core Bus Search & Ordered Route Evaluation Logic
  function handleBusSearch() {
    const boardingId = boardingSelect.value;
    const destinationId = destinationSelect.value;

    clearMessage();

    // Validation 1: Both stops must be selected
    if (!boardingId || !destinationId) {
      showMessage(
        'error',
        'Incomplete Selection',
        'Please select both a Boarding Stop and a Destination Stop to search for buses.'
      );
      resultsContainer.innerHTML = '';
      return;
    }

    // Validation 2: Boarding and Destination stops cannot be identical
    if (boardingId === destinationId) {
      showMessage(
        'error',
        'Identical Stops Selected',
        'Boarding and destination cannot be the same stop. Please choose different stops for your journey.'
      );
      resultsContainer.innerHTML = '';
      return;
    }

    const originStop = window.CityBusData.getStopById(boardingId);
    const destStop = window.CityBusData.getStopById(destinationId);

    // Show simulated loading state (mimics backend network latency)
    resultsContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner" aria-label="Searching for buses..."></div>
        <p class="text-muted text-sm font-semibold">Finding buses traveling from ${originStop.name} to ${destStop.name}...</p>
      </div>
    `;

    setTimeout(function () {
      executeSearchLogic(boardingId, destinationId, originStop, destStop);
    }, 350);
  }

  // 5. Execute Route Sequence Verification
  function executeSearchLogic(boardingId, destinationId, originStop, destStop) {
    const allRoutes = window.CityBusData.getRoutes();
    const allBuses = window.CityBusData.getBuses();

    const matchingBuses = [];
    let foundReverseRoute = false;

    // Check each route
    allRoutes.forEach(route => {
      const stops = route.stops;
      const boardingIndex = stops.indexOf(boardingId);
      const destinationIndex = stops.indexOf(destinationId);

      // Condition: BOTH stops exist on this route
      if (boardingIndex !== -1 && destinationIndex !== -1) {
        // VALID: Boarding stop occurs BEFORE destination stop along the route
        if (boardingIndex < destinationIndex) {
          // Find all buses operating on this route
          const routeBuses = allBuses.filter(bus => bus.routeId === route.id);
          routeBuses.forEach(bus => {
            const stopsCount = destinationIndex - boardingIndex;
            matchingBuses.push({
              bus: bus,
              route: route,
              stopsBetween: stopsCount,
              boardingIndex: boardingIndex,
              destinationIndex: destinationIndex
            });
          });
        } else {
          // Destination occurs before boarding stop -> Wrong direction for this route!
          foundReverseRoute = true;
        }
      }
    });

    // 6. Render Search Results
    renderSearchResults(matchingBuses, originStop, destStop, foundReverseRoute);
  }

  // Render the matching cards or helpful empty states
  function renderSearchResults(matches, originStop, destStop, foundReverseRoute) {
    resultsContainer.innerHTML = '';

    if (matches.length === 0) {
      if (foundReverseRoute) {
        // Explaining the ordered route concept clearly
        showMessage(
          'error',
          'Invalid Travel Direction',
          `Buses on this route travel in the opposite direction. You selected <strong>${originStop.name} ➔ ${destStop.name}</strong>, but along this line, <strong>${destStop.name}</strong> comes before <strong>${originStop.name}</strong>. Try clicking the <strong>Swap (⇄)</strong> button or check return routes.`
        );
      }

      resultsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🚌</div>
          <h3 class="empty-state-title">No Direct Buses Found</h3>
          <p class="empty-state-desc">
            We could not find active city buses currently scheduled directly from 
            <strong>${originStop.name}</strong> to <strong>${destStop.name}</strong> in this order.
          </p>
          <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" id="emptySwapBtn">⇄ Swap Direction</button>
            <a href="pages/routes.html" class="btn btn-outline btn-sm">Browse All Routes</a>
          </div>
        </div>
      `;

      const emptySwap = document.getElementById('emptySwapBtn');
      if (emptySwap) {
        emptySwap.addEventListener('click', function () {
          if (swapBtn) swapBtn.click();
        });
      }
      return;
    }

    // Header count
    const countBadge = document.createElement('div');
    countBadge.className = 'flex items-center justify-between';
    countBadge.style.marginBottom = '1rem';
    countBadge.innerHTML = `
      <div>
        <h3 class="font-bold" style="font-size: 1.1rem; color: var(--text-main);">
          Available Buses (${matches.length})
        </h3>
        <p class="text-muted text-sm">
          Traveling from <strong style="color: var(--primary-700);">${originStop.name}</strong> 
          to <strong style="color: var(--text-main);">${destStop.name}</strong>
        </p>
      </div>
      <span class="status-badge live">
        <span class="pulse-dot"></span> Real-Time Tracking
      </span>
    `;
    resultsContainer.appendChild(countBadge);

    // List of Bus Cards
    const busList = document.createElement('div');
    busList.className = 'bus-list';

    matches.forEach(item => {
      const bus = item.bus;
      const route = item.route;
      const currentStopName = window.BusApp.getStopName(bus.currentStopId);
      const nextStopName = window.BusApp.getStopName(bus.nextStopId);
      const etaMinutes = window.BusApp.calculateEtaMinutes(item.stopsBetween);

      const card = document.createElement('article');
      card.className = 'bus-card';
      card.innerHTML = `
        <div class="bus-card-header">
          <div class="bus-id-group">
            <div class="bus-icon-avatar">🚌</div>
            <div>
              <div class="bus-name">${bus.number}</div>
              <div class="bus-route-name">${route.number} • ${route.name}</div>
            </div>
          </div>
          <div class="status-badge live">
            <span class="pulse-dot"></span> ${bus.status}
          </div>
        </div>

        <div class="bus-card-route">
          <span>${originStop.name}</span>
          <span class="arrow">➔</span>
          <span>${destStop.name}</span>
          <span style="margin-left: auto; font-size: 0.75rem; color: var(--text-muted);">
            ${item.stopsBetween} stop${item.stopsBetween > 1 ? 's' : ''} away
          </span>
        </div>

        <div class="bus-card-details-grid">
          <div class="detail-item">
            <span class="detail-label">Current Stop</span>
            <span class="detail-value" style="color: var(--primary-700);">${currentStopName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Next Stop</span>
            <span class="detail-value">${nextStopName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Est. Travel Time</span>
            <span class="detail-value">~${etaMinutes} mins</span>
          </div>
        </div>

        <div class="bus-card-footer">
          <div class="bus-meta-tag">
            <span>Occupancy:</span>
            <strong>${bus.occupancy}</strong>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <a href="pages/live-map.html?busId=${bus.id}&routeId=${route.id}" class="btn btn-outline btn-sm">
              🗺️ Map View
            </a>
            <a href="pages/bus-details.html?busId=${bus.id}" class="btn btn-primary btn-sm">
              View Bus Details ➔
            </a>
          </div>
        </div>
      `;

      busList.appendChild(card);
    });

    resultsContainer.appendChild(busList);
  }

  // Attach search event
  searchBtn.addEventListener('click', handleBusSearch);

  // Initialize dropdown options
  populateStopDropdowns();
});
