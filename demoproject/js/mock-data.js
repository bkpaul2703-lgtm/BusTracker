/**
 * ==========================================================================
 * City Bus Tracker - Unified Mock Data Layer (mock-data.js)
 * ==========================================================================
 * Provides in-memory and localStorage-backed mock data for:
 * - Stops (City bus stations with GPS coordinates)
 * - Routes (Ordered stop sequences, timetables, colors)
 * - Buses (Vehicles, telemetry, route and driver assignments)
 * - Drivers (Staff records, assigned bus/route, trip status)
 * - Users (Passenger commuter accounts)
 * 
 * Includes full CRUD methods for the Admin interface. Any edits made by Admin
 * (such as reordering stops or adding routes) persist across pages via localStorage.
 */

const CityBusData = (function () {
  'use strict';

  const STORAGE_KEY = 'CITY_BUS_TRACKER_STORE_V2';

  // 1. Pristine Initial Dataset (Guwahati Transit Corridor)
  const defaultStops = [
    {
      id: "S001",
      name: "Jalukbari",
      landmark: "Near Gauhati University Flyover",
      latitude: 26.1542,
      longitude: 91.6621,
      status: "Active"
    },
    {
      id: "S002",
      name: "Adabari",
      landmark: "Adabari Tiniali Bus Stand",
      latitude: 26.1580,
      longitude: 91.6910,
      status: "Active"
    },
    {
      id: "S003",
      name: "Maligaon",
      landmark: "Near NF Railway HQ",
      latitude: 26.1620,
      longitude: 91.7050,
      status: "Active"
    },
    {
      id: "S004",
      name: "Paltan Bazar",
      landmark: "Guwahati Central Railway Station",
      latitude: 26.1810,
      longitude: 91.7460,
      status: "Active"
    },
    {
      id: "S009",
      name: "Chandmari",
      landmark: "Chandmari Colony Junction",
      latitude: 26.1890,
      longitude: 91.7760,
      status: "Active"
    },
    {
      id: "S005",
      name: "Ganeshguri",
      landmark: "Dispur Capital Flyover",
      latitude: 26.1465,
      longitude: 91.7880,
      status: "Active"
    },
    {
      id: "S006",
      name: "Beltola",
      landmark: "Beltola Tiniali Bazaar",
      latitude: 26.1250,
      longitude: 91.8020,
      status: "Active"
    },
    {
      id: "S007",
      name: "Narengi",
      landmark: "Narengi Army Camp Gate",
      latitude: 26.1750,
      longitude: 91.8320,
      status: "Active"
    },
    {
      id: "S008",
      name: "Khanapara",
      landmark: "Khanapara Farm Gate Interchange",
      latitude: 26.1150,
      longitude: 91.8250,
      status: "Active"
    },
    {
      id: "S010",
      name: "Six Mile",
      landmark: "Six Mile VIP Road Crossing",
      latitude: 26.1360,
      longitude: 91.8150,
      status: "Active"
    }
  ];

  const defaultRoutes = [
    {
      id: "R001",
      number: "Route 1",
      name: "Jalukbari ➔ Beltola Express",
      description: "Major east-west arterial corridor connecting University to Dispur Capital complex",
      color: "#2563eb",
      // Ordered stop IDs: passenger search strictly follows this index sequence!
      stops: ["S001", "S002", "S003", "S004", "S005", "S006"],
      frequencyMinutes: 10,
      firstBus: "06:00 AM",
      lastBus: "10:30 PM",
      totalDistanceKm: 21.5,
      estimatedMinutes: 55
    },
    {
      id: "R002",
      number: "Route 2",
      name: "Jalukbari ➔ Narengi Line",
      description: "Northern transit corridor serving Railway station, Chandmari and Narengi",
      color: "#7c3aed",
      stops: ["S001", "S002", "S004", "S009", "S007"],
      frequencyMinutes: 15,
      firstBus: "06:30 AM",
      lastBus: "09:45 PM",
      totalDistanceKm: 24.2,
      estimatedMinutes: 65
    },
    {
      id: "R003",
      number: "Route 3",
      name: "Khanapara ➔ Jalukbari Return",
      description: "Express return link connecting Khanapara, Beltola and Paltan Bazar back to Jalukbari",
      color: "#059669",
      stops: ["S008", "S006", "S005", "S004", "S002", "S001"],
      frequencyMinutes: 12,
      firstBus: "06:15 AM",
      lastBus: "10:00 PM",
      totalDistanceKm: 25.0,
      estimatedMinutes: 60
    }
  ];

  const defaultDrivers = [
    {
      id: "D001",
      name: "Rahul Sharma",
      phone: "+91 98765 11221",
      license: "AS-01-2018-00291",
      busId: "B001",
      status: "Active",
      experienceYears: 6,
      joinedDate: "Mar 2021"
    },
    {
      id: "D002",
      name: "Pranab Das",
      phone: "+91 98765 22332",
      license: "AS-01-2019-00842",
      busId: "B002",
      status: "Active",
      experienceYears: 4,
      joinedDate: "Nov 2022"
    },
    {
      id: "D003",
      name: "Manoj Kalita",
      phone: "+91 98765 33443",
      license: "AS-01-2017-00155",
      busId: "B003",
      status: "Active",
      experienceYears: 8,
      joinedDate: "Jan 2020"
    },
    {
      id: "D004",
      name: "Rupam Bora",
      phone: "+91 98765 44554",
      license: "AS-01-2020-00431",
      busId: "B004",
      status: "Active",
      experienceYears: 3,
      joinedDate: "Jul 2023"
    },
    {
      id: "D005",
      name: "Kamal Hazarika",
      phone: "+91 98765 55665",
      license: "AS-01-2016-00998",
      busId: "B005",
      status: "Active",
      experienceYears: 9,
      joinedDate: "Aug 2019"
    }
  ];

  const defaultBuses = [
    {
      id: "B001",
      number: "Bus 001",
      model: "Tata Starbus Ultra (AC)",
      regNumber: "AS-01-EC-1024",
      routeId: "R001",
      driverId: "D001",
      status: "Live",
      currentStopId: "S004", // Paltan Bazar
      nextStopId: "S005",    // Ganeshguri
      currentWaypointIndex: 8,
      speedKmH: 28,
      occupancy: "Moderate (65%)",
      capacity: 42
    },
    {
      id: "B002",
      number: "Bus 002",
      model: "Ashok Leyland JanBus",
      regNumber: "AS-01-GC-2041",
      routeId: "R001",
      driverId: "D002",
      status: "Live",
      currentStopId: "S002", // Adabari
      nextStopId: "S003",    // Maligaon
      currentWaypointIndex: 3,
      speedKmH: 22,
      occupancy: "Low (30%)",
      capacity: 38
    },
    {
      id: "B003",
      number: "Bus 003",
      model: "Eicher Skyline Pro",
      regNumber: "AS-01-MB-3055",
      routeId: "R001",
      driverId: "D003",
      status: "Live",
      currentStopId: "S005", // Ganeshguri
      nextStopId: "S006",    // Beltola
      currentWaypointIndex: 12,
      speedKmH: 31,
      occupancy: "Full (90%)",
      capacity: 50
    },
    {
      id: "B004",
      number: "Bus 004",
      model: "Tata Marcopolo City",
      regNumber: "AS-01-NS-1100",
      routeId: "R002",
      driverId: "D004",
      status: "Live",
      currentStopId: "S004", // Paltan Bazar
      nextStopId: "S009",    // Chandmari
      currentWaypointIndex: 4,
      speedKmH: 24,
      occupancy: "Moderate (55%)",
      capacity: 40
    },
    {
      id: "B005",
      number: "Bus 005",
      model: "BharatBenz City Express",
      regNumber: "AS-01-CL-4019",
      routeId: "R003",
      driverId: "D005",
      status: "Live",
      currentStopId: "S006", // Beltola
      nextStopId: "S005",    // Ganeshguri
      currentWaypointIndex: 2,
      speedKmH: 34,
      occupancy: "Low (40%)",
      capacity: 45
    }
  ];

  const defaultUsers = [
    {
      id: "U001",
      name: "Passenger User",
      email: "user@example.com",
      phone: "+91 98765 43210",
      role: "Passenger",
      memberSince: "January 2026",
      totalTrips: 28,
      status: "Active"
    },
    {
      id: "U002",
      name: "Ananya Goswami",
      email: "ananya.g@example.com",
      phone: "+91 98765 99887",
      role: "Passenger",
      memberSince: "February 2026",
      totalTrips: 14,
      status: "Active"
    },
    {
      id: "U003",
      name: "Bikash Saikia",
      email: "bikash.s@example.com",
      phone: "+91 98765 77665",
      role: "Passenger",
      memberSince: "March 2026",
      totalTrips: 9,
      status: "Active"
    }
  ];

  const routeWaypoints = {
    R001: [
      [26.1542, 91.6621], [26.1551, 91.6710], [26.1565, 91.6805],
      [26.1580, 91.6910], [26.1595, 91.6980], [26.1620, 91.7050],
      [26.1670, 91.7180], [26.1720, 91.7310], [26.1810, 91.7460],
      [26.1740, 91.7580], [26.1650, 91.7690], [26.1550, 91.7780],
      [26.1465, 91.7880], [26.1390, 91.7925], [26.1320, 91.7970],
      [26.1250, 91.8020]
    ],
    R002: [
      [26.1542, 91.6621], [26.1565, 91.6800], [26.1580, 91.6910],
      [26.1690, 91.7200], [26.1810, 91.7460], [26.1850, 91.7610],
      [26.1890, 91.7760], [26.1840, 91.7950], [26.1790, 91.8150],
      [26.1750, 91.8320]
    ],
    R003: [
      [26.1150, 91.8250], [26.1200, 91.8130], [26.1250, 91.8020],
      [26.1350, 91.7950], [26.1465, 91.7880], [26.1640, 91.7670],
      [26.1810, 91.7460], [26.1690, 91.7180], [26.1580, 91.6910],
      [26.1542, 91.6621]
    ]
  };

  // 2. Storage Persistence Manager (Loads from localStorage or defaults)
  let store = {
    stops: defaultStops,
    routes: defaultRoutes,
    buses: defaultBuses,
    drivers: defaultDrivers,
    users: defaultUsers
  };

  function loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.routes && parsed.stops && parsed.buses && parsed.drivers) {
            store = parsed;
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Could not read localStorage:', err);
    }
    // Default initialization
    saveToStorage();
  }

  function saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      }
    } catch (err) {
      console.warn('Could not write to localStorage:', err);
    }
  }

  // Initialize
  loadFromStorage();

  // 3. Public API & Mutation Methods (Drop-in replaceable by future REST API)
  return {
    // ----------------------------------------------------
    // STOPS API
    // ----------------------------------------------------
    getStops: function () {
      return [...store.stops];
    },

    getStopById: function (stopId) {
      return store.stops.find(s => s.id === stopId) || null;
    },

    addStop: function (newStop) {
      if (!newStop.id) {
        const nextNum = store.stops.length + 1;
        newStop.id = `S${String(nextNum).padStart(3, '0')}`;
      }
      if (!newStop.status) newStop.status = "Active";
      store.stops.push(newStop);
      saveToStorage();
      return { ...newStop };
    },

    updateStop: function (stopId, updatedData) {
      const idx = store.stops.findIndex(s => s.id === stopId);
      if (idx !== -1) {
        store.stops[idx] = { ...store.stops[idx], ...updatedData, id: stopId };
        saveToStorage();
        return store.stops[idx];
      }
      return null;
    },

    deleteStop: function (stopId) {
      const idx = store.stops.findIndex(s => s.id === stopId);
      if (idx !== -1) {
        // Also remove stop from all routes that reference it
        store.routes.forEach(r => {
          r.stops = r.stops.filter(sId => sId !== stopId);
        });
        store.stops.splice(idx, 1);
        saveToStorage();
        return true;
      }
      return false;
    },

    // ----------------------------------------------------
    // ROUTES API (CRITICAL FOR ADMIN & PASSENGER SEARCH)
    // ----------------------------------------------------
    getRoutes: function () {
      return store.routes.map(r => ({ ...r, stops: [...r.stops] }));
    },

    getRouteById: function (routeId) {
      const route = store.routes.find(r => r.id === routeId);
      return route ? { ...route, stops: [...route.stops] } : null;
    },

    getRouteWaypoints: function (routeId) {
      if (routeWaypoints[routeId]) {
        return [...routeWaypoints[routeId]];
      }
      // Generate fallback waypoints from current ordered stops
      const route = store.routes.find(r => r.id === routeId);
      if (!route || !route.stops) return [];
      const points = [];
      route.stops.forEach(sId => {
        const s = store.stops.find(stop => stop.id === sId);
        if (s) points.push([s.latitude, s.longitude]);
      });
      return points;
    },

    addRoute: function (newRoute) {
      if (!newRoute.id) {
        const nextNum = store.routes.length + 1;
        newRoute.id = `R${String(nextNum).padStart(3, '0')}`;
      }
      if (!newRoute.stops) newRoute.stops = [];
      if (!newRoute.color) newRoute.color = "#2563eb";
      store.routes.push(newRoute);
      saveToStorage();
      return { ...newRoute };
    },

    updateRoute: function (routeId, updatedData) {
      const idx = store.routes.findIndex(r => r.id === routeId);
      if (idx !== -1) {
        store.routes[idx] = { ...store.routes[idx], ...updatedData, id: routeId };
        saveToStorage();
        return { ...store.routes[idx] };
      }
      return null;
    },

    deleteRoute: function (routeId) {
      const idx = store.routes.findIndex(r => r.id === routeId);
      if (idx !== -1) {
        store.routes.splice(idx, 1);
        saveToStorage();
        return true;
      }
      return false;
    },

    // ----------------------------------------------------
    // BUSES API
    // ----------------------------------------------------
    getBuses: function () {
      return store.buses.map(b => ({ ...b }));
    },

    getBusById: function (busId) {
      const bus = store.buses.find(b => b.id === busId);
      return bus ? { ...bus } : null;
    },

    getBusesForRoute: function (routeId) {
      return store.buses.filter(b => b.routeId === routeId);
    },

    addBus: function (newBus) {
      if (!newBus.id) {
        const nextNum = store.buses.length + 1;
        newBus.id = `B${String(nextNum).padStart(3, '0')}`;
      }
      if (!newBus.status) newBus.status = "Live";
      store.buses.push(newBus);
      saveToStorage();
      return { ...newBus };
    },

    updateBus: function (busId, updatedData) {
      const idx = store.buses.findIndex(b => b.id === busId);
      if (idx !== -1) {
        store.buses[idx] = { ...store.buses[idx], ...updatedData, id: busId };
        saveToStorage();
        return { ...store.buses[idx] };
      }
      return null;
    },

    deleteBus: function (busId) {
      const idx = store.buses.findIndex(b => b.id === busId);
      if (idx !== -1) {
        store.buses.splice(idx, 1);
        saveToStorage();
        return true;
      }
      return false;
    },

    // ----------------------------------------------------
    // DRIVERS API
    // ----------------------------------------------------
    getDrivers: function () {
      return store.drivers.map(d => ({ ...d }));
    },

    getDriverById: function (driverId) {
      const driver = store.drivers.find(d => d.id === driverId);
      return driver ? { ...driver } : null;
    },

    getDriverForBus: function (busId) {
      return store.drivers.find(d => d.busId === busId) || null;
    },

    addDriver: function (newDriver) {
      if (!newDriver.id) {
        const nextNum = store.drivers.length + 1;
        newDriver.id = `D${String(nextNum).padStart(3, '0')}`;
      }
      if (!newDriver.status) newDriver.status = "Active";
      store.drivers.push(newDriver);
      saveToStorage();
      return { ...newDriver };
    },

    updateDriver: function (driverId, updatedData) {
      const idx = store.drivers.findIndex(d => d.id === driverId);
      if (idx !== -1) {
        store.drivers[idx] = { ...store.drivers[idx], ...updatedData, id: driverId };
        saveToStorage();
        return { ...store.drivers[idx] };
      }
      return null;
    },

    deleteDriver: function (driverId) {
      const idx = store.drivers.findIndex(d => d.id === driverId);
      if (idx !== -1) {
        store.drivers.splice(idx, 1);
        saveToStorage();
        return true;
      }
      return false;
    },

    // ----------------------------------------------------
    // USERS API
    // ----------------------------------------------------
    getUsers: function () {
      return store.users.map(u => ({ ...u }));
    },

    getUserProfile: function () {
      return {
        ...store.users[0],
        favoriteRouteIds: ["R001", "R002"],
        recentSearches: [
          { originId: "S004", destId: "S005", timestamp: "Today, 10:15 AM", originName: "Paltan Bazar", destName: "Ganeshguri" },
          { originId: "S001", destId: "S006", timestamp: "Yesterday, 4:30 PM", originName: "Jalukbari", destName: "Beltola" },
          { originId: "S002", destId: "S007", timestamp: "Sep 11, 2026", originName: "Adabari", destName: "Narengi" }
        ],
        stats: {
          totalTrips: 28,
          favoriteStop: "Paltan Bazar",
          estimatedCo2Saved: "42.5 kg"
        }
      };
    },

    // ----------------------------------------------------
    // DEMO RESET
    // ----------------------------------------------------
    resetToDefaults: function () {
      store = {
        stops: JSON.parse(JSON.stringify(defaultStops)),
        routes: JSON.parse(JSON.stringify(defaultRoutes)),
        buses: JSON.parse(JSON.stringify(defaultBuses)),
        drivers: JSON.parse(JSON.stringify(defaultDrivers)),
        users: JSON.parse(JSON.stringify(defaultUsers))
      };
      saveToStorage();
      return true;
    }
  };
})();

// Attach to window
if (typeof window !== 'undefined') {
  window.CityBusData = CityBusData;
}
