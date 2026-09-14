/**
 * ==========================================================================
 * City Bus Tracker - Admin Dashboard Overview (admin.js)
 * ==========================================================================
 * Calculates system KPIs:
 * - Fleet vehicle counts
 * - Route network size
 * - Active driver deployments
 * - Reset to Pristine Demo Data handler
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  function updateOverviewKPIs() {
    const buses = window.CityBusData.getBuses();
    const routes = window.CityBusData.getRoutes();
    const stops = window.CityBusData.getStops();
    const drivers = window.CityBusData.getDrivers();
    const users = window.CityBusData.getUsers();

    const elBuses = document.getElementById('kpiTotalBuses');
    const elRoutes = document.getElementById('kpiTotalRoutes');
    const elStops = document.getElementById('kpiTotalStops');
    const elDrivers = document.getElementById('kpiTotalDrivers');
    const elLiveBuses = document.getElementById('kpiLiveBuses');
    const elUsers = document.getElementById('kpiTotalUsers');

    const liveCount = buses.filter(b => b.status === 'Live').length;

    if (elBuses) elBuses.textContent = buses.length;
    if (elRoutes) elRoutes.textContent = routes.length;
    if (elStops) elStops.textContent = stops.length;
    if (elDrivers) elDrivers.textContent = drivers.length;
    if (elLiveBuses) elLiveBuses.textContent = liveCount;
    if (elUsers) elUsers.textContent = users.length;
  }

  // Handle Reset to Default Demo Data
  const resetBtn = document.getElementById('resetDemoDataBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      const ok = confirm('Reset all routes, stops, buses, and drivers back to initial default demo data?');
      if (ok) {
        window.CityBusData.resetToDefaults();
        alert('Data successfully restored to default Guwahati transit network.');
        window.location.reload();
      }
    });
  }

  updateOverviewKPIs();
});
