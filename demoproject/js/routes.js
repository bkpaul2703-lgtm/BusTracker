/**
 * ==========================================================================
 * City Bus Tracker - Routes Directory Controller (routes.js)
 * ==========================================================================
 * - Renders catalog of all configured routes
 * - Shows ordered stop sequences with step indicators
 * - Displays active running buses count for each route
 * - Allows expanding/collapsing stops list and navigating to Live Map
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const routesContainer = document.getElementById('routesDirectoryList');
  if (!routesContainer) return;

  function renderRoutes() {
    const routes = window.CityBusData.getRoutes();
    const buses = window.CityBusData.getBuses();

    routesContainer.innerHTML = '';

    routes.forEach(route => {
      // Find active buses running on this route
      const activeBuses = buses.filter(b => b.routeId === route.id);
      const startStop = window.CityBusData.getStopById(route.stops[0]);
      const endStop = window.CityBusData.getStopById(route.stops[route.stops.length - 1]);

      const routeCard = document.createElement('article');
      routeCard.className = 'card';
      routeCard.style.marginBottom = '1.5rem';

      // Build ordered stops list HTML
      const stopsHtml = route.stops.map((stopId, index) => {
        const stop = window.CityBusData.getStopById(stopId);
        const isFirst = index === 0;
        const isLast = index === route.stops.length - 1;
        const badgeColor = isFirst ? '#2563eb' : (isLast ? '#ef4444' : '#64748b');

        return `
          <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0;">
            <div style="width: 26px; height: 26px; border-radius: 50%; background-color: ${badgeColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;">
              ${index + 1}
            </div>
            <div>
              <strong style="color: #0f172a; font-size: 0.95rem;">${stop ? stop.name : stopId}</strong>
              <div style="font-size: 0.75rem; color: #64748b;">${stop ? stop.landmark : ''}</div>
            </div>
          </div>
        `;
      }).join(`
        <div style="margin-left: 12px; height: 16px; border-left: 2px dashed #cbd5e1;"></div>
      `);

      // Active buses badges
      const busesBadges = activeBuses.map(b => 
        `<a href="bus-details.html?busId=${b.id}" class="btn btn-outline btn-sm" style="font-size: 0.75rem;">🚌 ${b.number}</a>`
      ).join('');

      routeCard.innerHTML = `
        <div class="card-header" style="flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="background-color: ${route.color}; color: #fff; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.8rem;">
                ${route.number}
              </span>
              <h3 class="card-title" style="margin: 0;">${route.name}</h3>
            </div>
            <p class="text-muted text-sm" style="margin-top: 0.25rem;">${route.description}</p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <a href="live-map.html?routeId=${route.id}" class="btn btn-primary btn-sm">
              🗺️ Track on Live Map
            </a>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; background: var(--bg-app); padding: 1rem; border-radius: 8px;">
          <div>
            <span class="text-xs text-muted font-semibold">TERMINUS</span>
            <div class="text-sm font-semibold">${startStop ? startStop.name : ''} ➔ ${endStop ? endStop.name : ''}</div>
          </div>
          <div>
            <span class="text-xs text-muted font-semibold">TOTAL STOPS</span>
            <div class="text-sm font-semibold">${route.stops.length} Ordered Stops</div>
          </div>
          <div>
            <span class="text-xs text-muted font-semibold">FREQUENCY</span>
            <div class="text-sm font-semibold">Every ${route.frequencyMinutes} mins</div>
          </div>
          <div>
            <span class="text-xs text-muted font-semibold">RUNNING BUSES</span>
            <div class="text-sm font-semibold" style="color: var(--status-live-text);">
              ● ${activeBuses.length} Buses Active
            </div>
          </div>
        </div>

        <div>
          <h4 style="font-size: 0.875rem; font-weight: 700; color: #475569; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
            Stops in Sequential Order
          </h4>
          <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem 1.25rem;">
            ${stopsHtml}
          </div>
        </div>

        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span style="font-size: 0.8125rem; color: var(--text-muted);">Active Buses:</span>
            ${busesBadges || '<span style="font-size: 0.8rem; color: var(--text-light);">None currently</span>'}
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">
            Operating hours: ${route.firstBus} – ${route.lastBus}
          </span>
        </div>
      `;

      routesContainer.appendChild(routeCard);
    });
  }

  renderRoutes();
});
