/**
 * ==========================================================================
 * City Bus Tracker - Passenger Profile Controller (profile.js)
 * ==========================================================================
 * - Renders mock commuter profile information
 * - Displays favorite routes with quick map shortcuts
 * - Displays recent search history with one-click search replay
 * - Displays commuter impact metrics (trips, favorite stop, CO2 saved)
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const profile = window.CityBusData.getUserProfile();
  if (!profile) return;

  // 1. Populate Profile Details
  const nameEl = document.getElementById('profileName');
  const emailEl = document.getElementById('profileEmail');
  const phoneEl = document.getElementById('profilePhone');
  const memberEl = document.getElementById('profileMemberSince');
  const typeEl = document.getElementById('profileUserType');

  if (nameEl) nameEl.textContent = profile.name;
  if (emailEl) emailEl.textContent = profile.email;
  if (phoneEl) phoneEl.textContent = profile.phone;
  if (memberEl) memberEl.textContent = profile.memberSince;
  if (typeEl) typeEl.textContent = profile.userType;

  // 2. Populate Commuter Impact Statistics
  const statTripsEl = document.getElementById('statTotalTrips');
  const statStopEl = document.getElementById('statFavoriteStop');
  const statCo2El = document.getElementById('statCo2Saved');

  if (statTripsEl) statTripsEl.textContent = profile.stats.totalTrips;
  if (statStopEl) statStopEl.textContent = profile.stats.favoriteStop;
  if (statCo2El) statCo2El.textContent = profile.stats.estimatedCo2Saved;

  // 3. Render Favorite Routes
  const favListEl = document.getElementById('favoriteRoutesList');
  if (favListEl) {
    favListEl.innerHTML = '';
    profile.favoriteRouteIds.forEach(routeId => {
      const route = window.CityBusData.getRouteById(routeId);
      if (!route) return;

      const card = document.createElement('div');
      card.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1rem;
        background: #f8fafc;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        margin-bottom: 0.75rem;
      `;

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="background-color: ${route.color}; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">
            ${route.number}
          </span>
          <div>
            <strong style="color: #0f172a; font-size: 0.9375rem;">${route.name}</strong>
            <div style="font-size: 0.75rem; color: #64748b;">${route.stops.length} stops • Every ${route.frequencyMinutes}m</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <a href="live-map.html?routeId=${route.id}" class="btn btn-outline btn-sm" style="font-size: 0.8rem;">
            🗺️ Track
          </a>
        </div>
      `;

      favListEl.appendChild(card);
    });
  }

  // 4. Render Recent Searches with One-Click Search Action
  const recentSearchesEl = document.getElementById('recentSearchesList');
  if (recentSearchesEl) {
    recentSearchesEl.innerHTML = '';
    profile.recentSearches.forEach(search => {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1rem;
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        margin-bottom: 0.75rem;
        transition: background 0.15s;
      `;

      item.innerHTML = `
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #0f172a; font-size: 0.9375rem;">
            <span>${search.originName}</span>
            <span style="color: var(--primary-600);">➔</span>
            <span>${search.destName}</span>
          </div>
          <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">
            🕒 Searched ${search.timestamp}
          </div>
        </div>
        <a href="../index.html?origin=${search.originId}&dest=${search.destId}" class="btn btn-secondary btn-sm" style="font-size: 0.8rem;">
          Search Again ➔
        </a>
      `;

      recentSearchesEl.appendChild(item);
    });
  }
});
