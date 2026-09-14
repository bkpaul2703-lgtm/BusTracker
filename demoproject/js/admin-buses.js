/**
 * ==========================================================================
 * City Bus Tracker - Admin Buses Management (admin-buses.js)
 * ==========================================================================
 * Manages city bus fleet:
 * - Table: Bus ID | Bus Number | Model | Assigned Route | Assigned Driver | Status
 * - Add new bus
 * - Edit bus assignments & operational status
 * - Delete bus with confirmation
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const tableBody = document.getElementById('busesTableBody');
  if (!tableBody) return;

  const busModal = document.getElementById('busFormModal');
  const confirmModal = document.getElementById('confirmActionModal');
  let isEditing = false;
  let activeCallback = null;

  // 1. Render Buses Table
  function renderBuses() {
    const buses = window.CityBusData.getBuses();
    tableBody.innerHTML = '';

    buses.forEach(bus => {
      const route = window.CityBusData.getRouteById(bus.routeId);
      const driver = window.CityBusData.getDriverById(bus.driverId);

      let statusBadgeClass = 'live';
      if (bus.status === 'Stopped') statusBadgeClass = 'stopped';
      else if (bus.status === 'Maintenance' || bus.status === 'Offline') statusBadgeClass = 'offline';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--primary-700);">${bus.id}</strong></td>
        <td>
          <strong>${bus.number}</strong>
          <div class="text-xs text-muted">${bus.regNumber}</div>
        </td>
        <td class="text-sm">${bus.model || 'Standard City Bus'}</td>
        <td>
          ${route ? `<span style="font-weight:600; color:var(--text-main);">${route.number}</span> <span class="text-xs text-muted">(${route.name})</span>` : '<span class="text-muted">Unassigned</span>'}
        </td>
        <td>
          ${driver ? `<strong>${driver.name}</strong> <span class="text-xs text-muted">(${driver.id})</span>` : '<span class="text-muted">Unassigned</span>'}
        </td>
        <td>
          <span class="status-badge ${statusBadgeClass}">
            ${bus.status === 'Live' ? '<span class="pulse-dot"></span>' : ''} ${bus.status}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-outline btn-sm edit-bus-btn" data-id="${bus.id}">
              ✏️ Edit
            </button>
            <button type="button" class="btn btn-outline btn-sm delete-bus-btn" data-id="${bus.id}" style="color: #dc2626; border-color: #fecaca;">
              🗑️ Delete
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    document.querySelectorAll('.edit-bus-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        openEditBus(this.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('.delete-bus-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        openDeleteBus(this.getAttribute('data-id'));
      });
    });
  }

  // 2. Populate Route & Driver Dropdowns
  function populateDropdowns() {
    const routeSelect = document.getElementById('busRouteSelect');
    const driverSelect = document.getElementById('busDriverSelect');

    if (routeSelect) {
      routeSelect.innerHTML = '<option value="">-- No Route Assigned --</option>';
      window.CityBusData.getRoutes().forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `${r.number}: ${r.name}`;
        routeSelect.appendChild(opt);
      });
    }

    if (driverSelect) {
      driverSelect.innerHTML = '<option value="">-- No Driver Assigned --</option>';
      window.CityBusData.getDrivers().forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = `${d.name} (${d.id})`;
        driverSelect.appendChild(opt);
      });
    }
  }

  // 3. Open Add Bus
  const addBusBtn = document.getElementById('openAddBusModalBtn');
  if (addBusBtn) {
    addBusBtn.addEventListener('click', function () {
      isEditing = false;
      populateDropdowns();
      document.getElementById('busModalTitle').textContent = 'Register New Bus';
      document.getElementById('busIdInput').value = '';
      document.getElementById('busIdInput').disabled = false;
      document.getElementById('busNumberInput').value = '';
      document.getElementById('busModelInput').value = '';
      document.getElementById('busRegInput').value = '';
      document.getElementById('busStatusSelect').value = 'Live';
      busModal.classList.add('active');
    });
  }

  // 4. Open Edit Bus
  function openEditBus(busId) {
    const bus = window.CityBusData.getBusById(busId);
    if (!bus) return;

    isEditing = true;
    populateDropdowns();
    document.getElementById('busModalTitle').textContent = `Edit Bus: ${bus.number}`;
    document.getElementById('busIdInput').value = bus.id;
    document.getElementById('busIdInput').disabled = true;
    document.getElementById('busNumberInput').value = bus.number;
    document.getElementById('busModelInput').value = bus.model || '';
    document.getElementById('busRegInput').value = bus.regNumber || '';
    document.getElementById('busRouteSelect').value = bus.routeId || '';
    document.getElementById('busDriverSelect').value = bus.driverId || '';
    document.getElementById('busStatusSelect').value = bus.status || 'Live';
    busModal.classList.add('active');
  }

  // 5. Save Bus Form
  const saveBusBtn = document.getElementById('saveBusFormBtn');
  if (saveBusBtn) {
    saveBusBtn.addEventListener('click', function () {
      const id = document.getElementById('busIdInput').value.trim();
      const number = document.getElementById('busNumberInput').value.trim();
      const model = document.getElementById('busModelInput').value.trim();
      const regNumber = document.getElementById('busRegInput').value.trim();
      const routeId = document.getElementById('busRouteSelect').value;
      const driverId = document.getElementById('busDriverSelect').value;
      const status = document.getElementById('busStatusSelect').value;

      if (!number) {
        alert('Please enter a bus number.');
        return;
      }

      if (isEditing) {
        window.CityBusData.updateBus(id, { number, model, regNumber, routeId, driverId, status });
      } else {
        window.CityBusData.addBus({
          id: id || undefined,
          number,
          model,
          regNumber: regNumber || 'AS-01-XX-0000',
          routeId,
          driverId,
          status,
          capacity: 40,
          occupancy: 'Low (25%)',
          speedKmH: 25
        });
      }

      busModal.classList.remove('active');
      renderBuses();
    });
  }

  // 6. Delete Bus
  function openDeleteBus(busId) {
    const bus = window.CityBusData.getBusById(busId);
    if (!bus) return;

    document.getElementById('confirmModalTitle').textContent = `Delete ${bus.number}?`;
    document.getElementById('confirmModalMessage').innerHTML = `
      Are you sure you want to decommission and delete <strong>${bus.number} (${bus.id})</strong>?
    `;
    document.getElementById('confirmModalActionBtn').textContent = 'Delete Bus';

    activeCallback = function () {
      window.CityBusData.deleteBus(busId);
      renderBuses();
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
      if (busModal) busModal.classList.remove('active');
      if (confirmModal) confirmModal.classList.remove('active');
    });
  });

  renderBuses();
});
