/**
 * ==========================================================================
 * City Bus Tracker - Admin Stops Management (admin-stops.js)
 * ==========================================================================
 * Manages transit stops:
 * - Render table with Stop ID, Name, Landmark, Latitude, Longitude, Status
 * - Add new city stop
 * - Edit stop details & coordinates
 * - Delete stop with confirmation
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const tableBody = document.getElementById('stopsTableBody');
  if (!tableBody) return;

  const stopModal = document.getElementById('stopFormModal');
  const confirmModal = document.getElementById('confirmActionModal');
  let isEditing = false;
  let activeCallback = null;

  // 1. Render Stops Table
  function renderStops() {
    const stops = window.CityBusData.getStops();
    tableBody.innerHTML = '';

    stops.forEach(stop => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--primary-700);">${stop.id}</strong></td>
        <td><strong>${stop.name}</strong></td>
        <td class="text-muted text-sm">${stop.landmark || '--'}</td>
        <td style="font-family: var(--font-mono); font-size: 0.8125rem;">${stop.latitude.toFixed(4)}</td>
        <td style="font-family: var(--font-mono); font-size: 0.8125rem;">${stop.longitude.toFixed(4)}</td>
        <td>
          <span class="status-badge ${stop.status === 'Active' ? 'live' : 'offline'}">
            ${stop.status === 'Active' ? '<span class="pulse-dot"></span>' : ''} ${stop.status}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-outline btn-sm edit-stop-btn" data-id="${stop.id}">
              ✏️ Edit
            </button>
            <button type="button" class="btn btn-outline btn-sm delete-stop-btn" data-id="${stop.id}" style="color: #dc2626; border-color: #fecaca;">
              🗑️ Delete
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Wire up actions
    document.querySelectorAll('.edit-stop-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        openEditStop(this.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('.delete-stop-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        openDeleteStop(this.getAttribute('data-id'));
      });
    });
  }

  // 2. Open Add Stop
  const addStopBtn = document.getElementById('openAddStopModalBtn');
  if (addStopBtn) {
    addStopBtn.addEventListener('click', function () {
      isEditing = false;
      document.getElementById('stopModalTitle').textContent = 'Add New Bus Stop';
      document.getElementById('stopIdInput').value = '';
      document.getElementById('stopIdInput').disabled = false;
      document.getElementById('stopNameInput').value = '';
      document.getElementById('stopLandmarkInput').value = '';
      document.getElementById('stopLatInput').value = '26.1550';
      document.getElementById('stopLngInput').value = '91.7500';
      document.getElementById('stopStatusSelect').value = 'Active';
      stopModal.classList.add('active');
    });
  }

  // 3. Open Edit Stop
  function openEditStop(stopId) {
    const stop = window.CityBusData.getStopById(stopId);
    if (!stop) return;

    isEditing = true;
    document.getElementById('stopModalTitle').textContent = `Edit Stop: ${stop.name}`;
    document.getElementById('stopIdInput').value = stop.id;
    document.getElementById('stopIdInput').disabled = true; // Primary key preserved
    document.getElementById('stopNameInput').value = stop.name;
    document.getElementById('stopLandmarkInput').value = stop.landmark || '';
    document.getElementById('stopLatInput').value = stop.latitude;
    document.getElementById('stopLngInput').value = stop.longitude;
    document.getElementById('stopStatusSelect').value = stop.status || 'Active';
    stopModal.classList.add('active');
  }

  // 4. Save Stop Form (Add or Edit)
  const saveStopBtn = document.getElementById('saveStopFormBtn');
  if (saveStopBtn) {
    saveStopBtn.addEventListener('click', function () {
      const id = document.getElementById('stopIdInput').value.trim();
      const name = document.getElementById('stopNameInput').value.trim();
      const landmark = document.getElementById('stopLandmarkInput').value.trim();
      const lat = parseFloat(document.getElementById('stopLatInput').value);
      const lng = parseFloat(document.getElementById('stopLngInput').value);
      const status = document.getElementById('stopStatusSelect').value;

      if (!name || isNaN(lat) || isNaN(lng)) {
        alert('Please enter valid Stop Name and GPS coordinates.');
        return;
      }

      if (isEditing) {
        window.CityBusData.updateStop(id, { name, landmark, latitude: lat, longitude: lng, status });
      } else {
        window.CityBusData.addStop({ id: id || undefined, name, landmark, latitude: lat, longitude: lng, status });
      }

      stopModal.classList.remove('active');
      renderStops();
    });
  }

  // 5. Delete Stop with Confirmation
  function openDeleteStop(stopId) {
    const stop = window.CityBusData.getStopById(stopId);
    if (!stop) return;

    document.getElementById('confirmModalTitle').textContent = `Delete Stop ${stop.name}?`;
    document.getElementById('confirmModalMessage').innerHTML = `
      Are you sure you want to delete stop <strong>${stop.name} (${stop.id})</strong>? 
      This stop will automatically be removed from any routes currently serving it.
    `;
    document.getElementById('confirmModalActionBtn').textContent = 'Delete Stop';

    activeCallback = function () {
      window.CityBusData.deleteStop(stopId);
      renderStops();
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

  // Modal Closers
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function () {
      if (stopModal) stopModal.classList.remove('active');
      if (confirmModal) confirmModal.classList.remove('active');
    });
  });

  renderStops();
});
