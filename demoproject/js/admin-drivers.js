/**
 * ==========================================================================
 * City Bus Tracker - Admin Drivers Management (admin-drivers.js)
 * ==========================================================================
 * Manages transit drivers:
 * - Table: Driver ID | Driver Name | Assigned Bus | Assigned Route | Status
 * - Add new driver
 * - Edit driver details & bus assignments
 * - Delete driver record
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const tableBody = document.getElementById('driversTableBody');
  if (!tableBody) return;

  const driverModal = document.getElementById('driverFormModal');
  const confirmModal = document.getElementById('confirmActionModal');
  let isEditing = false;
  let activeCallback = null;

  // 1. Render Drivers Table
  function renderDrivers() {
    const drivers = window.CityBusData.getDrivers();
    tableBody.innerHTML = '';

    drivers.forEach(driver => {
      const bus = window.CityBusData.getBusById(driver.busId);
      const route = bus ? window.CityBusData.getRouteById(bus.routeId) : null;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--primary-700);">${driver.id}</strong></td>
        <td>
          <strong>${driver.name}</strong>
          <div class="text-xs text-muted">${driver.phone || '--'}</div>
        </td>
        <td class="text-xs" style="font-family: var(--font-mono);">${driver.license || '--'}</td>
        <td>
          ${bus ? `<strong>${bus.number}</strong> <span class="text-xs text-muted">(${bus.id})</span>` : '<span class="text-muted">Unassigned</span>'}
        </td>
        <td>
          ${route ? `<strong>${route.number}</strong> <span class="text-xs text-muted">(${route.name})</span>` : '<span class="text-muted">--</span>'}
        </td>
        <td>
          <span class="status-badge ${driver.status === 'Active' ? 'live' : 'offline'}">
            ${driver.status === 'Active' ? '<span class="pulse-dot"></span>' : ''} ${driver.status}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-outline btn-sm edit-driver-btn" data-id="${driver.id}">
              ✏️ Edit
            </button>
            <button type="button" class="btn btn-outline btn-sm delete-driver-btn" data-id="${driver.id}" style="color: #dc2626; border-color: #fecaca;">
              🗑️ Delete
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    document.querySelectorAll('.edit-driver-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        openEditDriver(this.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('.delete-driver-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        openDeleteDriver(this.getAttribute('data-id'));
      });
    });
  }

  // 2. Populate Bus Dropdown
  function populateBusDropdown() {
    const busSelect = document.getElementById('driverBusSelect');
    if (!busSelect) return;
    busSelect.innerHTML = '<option value="">-- No Bus Assigned --</option>';
    window.CityBusData.getBuses().forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `${b.number} (${b.id}) - ${b.model}`;
      busSelect.appendChild(opt);
    });
  }

  // 3. Open Add Driver
  const addDriverBtn = document.getElementById('openAddDriverModalBtn');
  if (addDriverBtn) {
    addDriverBtn.addEventListener('click', function () {
      isEditing = false;
      populateBusDropdown();
      document.getElementById('driverModalTitle').textContent = 'Register New Driver';
      document.getElementById('driverIdInput').value = '';
      document.getElementById('driverIdInput').disabled = false;
      document.getElementById('driverNameInput').value = '';
      document.getElementById('driverPhoneInput').value = '';
      document.getElementById('driverLicenseInput').value = '';
      document.getElementById('driverStatusSelect').value = 'Active';
      driverModal.classList.add('active');
    });
  }

  // 4. Open Edit Driver
  function openEditDriver(driverId) {
    const driver = window.CityBusData.getDriverById(driverId);
    if (!driver) return;

    isEditing = true;
    populateBusDropdown();
    document.getElementById('driverModalTitle').textContent = `Edit Driver: ${driver.name}`;
    document.getElementById('driverIdInput').value = driver.id;
    document.getElementById('driverIdInput').disabled = true;
    document.getElementById('driverNameInput').value = driver.name;
    document.getElementById('driverPhoneInput').value = driver.phone || '';
    document.getElementById('driverLicenseInput').value = driver.license || '';
    document.getElementById('driverBusSelect').value = driver.busId || '';
    document.getElementById('driverStatusSelect').value = driver.status || 'Active';
    driverModal.classList.add('active');
  }

  // 5. Save Driver
  const saveDriverBtn = document.getElementById('saveDriverFormBtn');
  if (saveDriverBtn) {
    saveDriverBtn.addEventListener('click', function () {
      const id = document.getElementById('driverIdInput').value.trim();
      const name = document.getElementById('driverNameInput').value.trim();
      const phone = document.getElementById('driverPhoneInput').value.trim();
      const license = document.getElementById('driverLicenseInput').value.trim();
      const busId = document.getElementById('driverBusSelect').value;
      const status = document.getElementById('driverStatusSelect').value;

      if (!name) {
        alert('Please enter the driver name.');
        return;
      }

      if (isEditing) {
        window.CityBusData.updateDriver(id, { name, phone, license, busId, status });
        // Also update bus driverId linkage
        if (busId) {
          window.CityBusData.updateBus(busId, { driverId: id });
        }
      } else {
        window.CityBusData.addDriver({
          id: id || undefined,
          name,
          phone,
          license,
          busId,
          status,
          experienceYears: 2,
          joinedDate: 'Sep 2026'
        });
        if (busId) {
          window.CityBusData.updateBus(busId, { driverId: id });
        }
      }

      driverModal.classList.remove('active');
      renderDrivers();
    });
  }

  // 6. Delete Driver
  function openDeleteDriver(driverId) {
    const driver = window.CityBusData.getDriverById(driverId);
    if (!driver) return;

    document.getElementById('confirmModalTitle').textContent = `Delete Driver ${driver.name}?`;
    document.getElementById('confirmModalMessage').innerHTML = `
      Are you sure you want to remove driver record <strong>${driver.name} (${driver.id})</strong>?
    `;
    document.getElementById('confirmModalActionBtn').textContent = 'Delete Driver';

    activeCallback = function () {
      window.CityBusData.deleteDriver(driverId);
      renderDrivers();
    };

    confirmModal.classList.add('active');
  }

  const confirmActionBtn = document.getElementById('confirmModalActionBtn');
  if (confirmActionBtn) {
    confirmActionBtn.addEventListener('click', function () {
      if (activeCallback) {
        activeCallback();
        activeCallback = null;
      }
      confirmModal.classList.remove('active');
    });
  }

  // Closers
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function () {
      if (driverModal) driverModal.classList.remove('active');
      if (confirmModal) confirmModal.classList.remove('active');
    });
  });

  renderDrivers();
});
