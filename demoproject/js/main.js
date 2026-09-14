/**
 * ==========================================================================
 * City Bus Tracker - Main Application Utilities (main.js)
 * ==========================================================================
 * Provides shared UI helpers:
 * - Live digital clock display
 * - Mobile sidebar navigation drawer toggle
 * - Global Role Switcher dropdown controller (Passenger, Driver, Admin)
 * - Navigation link active state highlight
 * - Helper lookups for stops, routes, buses, and drivers
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // 1. Initialize Real-Time Clock in Top Navbar
  function initLiveClock() {
    const clockElement = document.getElementById('liveClockText');
    if (!clockElement) return;

    function updateTime() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    updateTime();
    setInterval(updateTime, 1000);
  }

  // 2. Mobile Sidebar & Drawer Toggle
  function initMobileMenu() {
    const toggleBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    if (!toggleBtn || !sidebar) return;

    function toggleMenu() {
      const isOpen = sidebar.classList.toggle('open');
      if (backdrop) {
        backdrop.classList.toggle('active', isOpen);
      }
    }

    toggleBtn.addEventListener('click', toggleMenu);

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      });
    }

    // Close mobile menu when a sidebar link is clicked
    const links = sidebar.querySelectorAll('.sidebar-link');
    links.forEach(link => {
      link.addEventListener('click', function () {
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
      });
    });
  }

  // 3. Global Role Switcher Dropdown
  function initRoleSwitcher() {
    const switcherBtn = document.getElementById('roleSwitcherBtn');
    const dropdownMenu = document.getElementById('roleDropdownMenu');

    if (!switcherBtn || !dropdownMenu) return;

    switcherBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle('show');
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!dropdownMenu.contains(e.target) && e.target !== switcherBtn) {
        dropdownMenu.classList.remove('show');
      }
    });
  }

  // 4. Highlight Active Navigation Items based on Current URL
  function highlightActiveNav() {
    const currentPath = window.location.pathname.toLowerCase();
    
    // Sidebar links
    const navLinks = document.querySelectorAll('.sidebar-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const normalizedHref = href.toLowerCase().replace(/^\.\.?\//, '');
      
      if (
        (currentPath.endsWith('/') || currentPath.endsWith('index.html')) &&
        (normalizedHref === 'index.html' || normalizedHref === './index.html' || normalizedHref === '../index.html')
      ) {
        link.classList.add('active');
      } else if (currentPath.includes(normalizedHref.replace('.html', ''))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Mobile bottom nav links
    const mobileLinks = document.querySelectorAll('.mobile-nav-item');
    mobileLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const normalizedHref = href.toLowerCase().replace(/^\.\.?\//, '');

      if (
        (currentPath.endsWith('/') || currentPath.endsWith('index.html')) &&
        (normalizedHref === 'index.html' || normalizedHref === './index.html' || normalizedHref === '../index.html')
      ) {
        link.classList.add('active');
      } else if (currentPath.includes(normalizedHref.replace('.html', ''))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Run initializations
  initLiveClock();
  initMobileMenu();
  initRoleSwitcher();
  highlightActiveNav();
});

// Shared Helper Utilities attached to window
window.BusApp = {
  // Format stop name lookup
  getStopName: function (stopId) {
    if (window.CityBusData) {
      const stop = window.CityBusData.getStopById(stopId);
      return stop ? stop.name : stopId;
    }
    return stopId;
  },

  // Format route display name lookup
  getRouteName: function (routeId) {
    if (window.CityBusData) {
      const route = window.CityBusData.getRouteById(routeId);
      return route ? `${route.number} (${route.name})` : routeId;
    }
    return routeId;
  },

  // Format driver name lookup
  getDriverName: function (driverId) {
    if (window.CityBusData) {
      const driver = window.CityBusData.getDriverById(driverId);
      return driver ? driver.name : 'Unassigned';
    }
    return 'Unassigned';
  },

  // Calculate simulated ETA between stops in minutes
  calculateEtaMinutes: function (stopsCount) {
    return Math.max(4, stopsCount * 7);
  }
};
