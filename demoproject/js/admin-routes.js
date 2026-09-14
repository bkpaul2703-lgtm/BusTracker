/**
 * ==========================================================================
 * City Bus Tracker - Admin Route Management (admin-routes.js)
 * ==========================================================================
 * CRITICAL FUNCTIONALITY:
 * - Render all transit routes with ordered stop sequences
 * - Edit Route Modal:
 *   - Edit route name and description
 *   - Move stop up [↑]
 *   - Move stop down [↓]
 *   - Remove stop with confirmation dialog
 *   - Add stop via dropdown selector of available stops
 *   - Save changes to localStorage via CityBusData.updateRoute()
 * - Add New Route Modal:
 *   - Create a brand new route with ordered stop list
 * - Delete Route with confirmation dialog
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const routesContainer = document.getElementById('adminRoutesGrid');
  if (!routesContainer) return;

  // Modals & Elements
  const editModal = document.getElementById('editRouteModal');
  const addRouteModal = document.getElementById('addRouteModal');
  const confirmModal = document.getElementById('confirmActionModal');

  // Edit Route State (in-progress working copy)
  let editingRoute = null;
  let activeCallbackOnConfirm = null;

  // 1. Render Routes List
  function renderRoutes() {
    const routes = window.CityBusData.getRoutes();
    routesContainer.innerHTML = '';

    routes.forEach(route => {
      const card = document.createElement('article');
      card.className = 'card';
      card.style.marginBottom = '1.5rem';

      // Ordered stops sequence HTML
      const stopsHtml = route.stops.map((stopId, idx) => {
        const stop = window.CityBusData.getStopById(stopId);
        return `
          <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0;">
            <span class="stop-seq-badge">${idx + 1}</span>
            <span style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">
              ${stop ? stop.name : stopId}
            </span>
            <span class="text-xs text-muted">(${stop ? stop.landmark : ''})</span>
          </div>
        `;
      }).join(`
        <div style="margin-left: 10px; height: 12px; border-left: 2px dashed #cbd5e1;"></div>
      `);

      card.innerHTML = `
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="background-color: ${route.color}; color: #fff; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.8rem;">
                ${route.number}
              </span>
              <h3 class="card-title" style="margin: 0; font-size: 1.15rem;">${route.name}</h3>
            </div>
            <p class="text-xs text-muted" style="margin-top: 0.25rem;">${route.description}</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="btn btn-outline btn-sm edit-route-btn" data-id="${route.id}">
              ✏️ Edit Route
            </button>
            <button type="button" class="btn btn-outline btn-sm delete-route-btn" data-id="${route.id}" style="color: #dc2626; border-color: #fecaca;">
              🗑️ Delete Route
            </button>
          </div>
        </div>

        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1rem; background: var(--bg-app); padding: 0.75rem 1rem; border-radius: 8px;">
          <div><strong>ID:</strong> ${route.id}</div>
          <div><strong>Total Stops:</strong> ${route.stops.length} in sequence</div>
          <div><strong>Frequency:</strong> Every ${route.frequencyMinutes}m</div>
          <div><strong>Est. Duration:</strong> ${route.estimatedMinutes}m (${route.totalDistanceKm} km)</div>
        </div>

        <div>
          <div class="text-xs font-semibold text-muted" style="text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
            Ordered Route Sequence (Passenger Direction Path):
          </div>
          <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.875rem 1rem;">
            ${stopsHtml || '<span class="text-muted text-xs">No stops defined for this route.</span>'}
          </div>
        </div>
      `;

      routesContainer.appendChild(card);
    });

    // Attach Edit & Delete button handlers
    document.querySelectorAll('.edit-route-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        openEditRouteModal(id);
      });
    });

    document.querySelectorAll('.delete-route-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        openDeleteRouteConfirm(id);
      });
    });
  }

  // 2. Open Edit Route Modal
  function openEditRouteModal(routeId) {
    const route = window.CityBusData.getRouteById(routeId);
    if (!route) return;

    // Create deep copy for editing
    editingRoute = JSON.parse(JSON.stringify(route));

    document.getElementById('editRouteId').value = editingRoute.id;
    document.getElementById('editRouteNumber').value = editingRoute.number;
    document.getElementById('editRouteName').value = editingRoute.name;
    document.getElementById('editRouteDesc').value = editingRoute.description || '';
    document.getElementById('editRouteColor').value = editingRoute.color || '#2563eb';

    renderEditStopsList();
    populateAvailableStopsDropdown();

    editModal.classList.add('active');
  }

  // 3. Render Reorderable Stops List inside Edit Modal
  function renderEditStopsList() {
    const listEl = document.getElementById('editStopsList');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!editingRoute.stops || editingRoute.stops.length === 0) {
      listEl.innerHTML = '<div class="text-muted text-xs" style="padding: 0.5rem;">No stops attached to this route yet. Add one below.</div>';
      return;
    }

    editingRoute.stops.forEach((stopId, idx) => {
      const stop = window.CityBusData.getStopById(stopId);
      const isFirst = idx === 0;
      const isLast = idx === editingRoute.stops.length - 1;

      const item = document.createElement('div');
      item.className = 'stop-reorder-item';

      item.innerHTML = `
        <div class="stop-reorder-meta">
          <span class="stop-seq-badge">${idx + 1}</span>
          <div>
            <strong style="font-size: 0.9375rem; color: #0f172a;">${stop ? stop.name : stopId}</strong>
            <div style="font-size: 0.75rem; color: #64748b;">${stop ? stop.landmark : ''}</div>
          </div>
        </div>

        <div class="stop-reorder-actions">
          <!-- Move Up -->
          <button type="button" class="btn-reorder move-up-btn" data-index="${idx}" ${isFirst ? 'disabled' : ''} title="Move Up">
            ↑
          </button>
          <!-- Move Down -->
          <button type="button" class="btn-reorder move-down-btn" data-index="${idx}" ${isLast ? 'disabled' : ''} title="Move Down">
            ↓
          </button>
          <!-- Remove Stop -->
          <button type="button" class="btn btn-outline btn-sm remove-stop-btn" data-index="${idx}" style="color:#dc2626; border-color:#fecaca; margin-left: 0.35rem; padding: 0.25rem 0.6rem; font-size: 0.75rem;">
            Remove
          </button>
        </div>
      `;

      listEl.appendChild(item);
    });

    // Wire up Move Up buttons
    listEl.querySelectorAll('.move-up-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const i = parseInt(this.getAttribute('data-index'), 10);
        if (i > 0) {
          // Swap with previous stop
          const temp = editingRoute.stops[i];
          editingRoute.stops[i] = editingRoute.stops[i - 1];
          editingRoute.stops[i - 1] = temp;
          renderEditStopsList();
        }
      });
    });

    // Wire up Move Down buttons
    listEl.querySelectorAll('.move-down-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const i = parseInt(this.getAttribute('data-index'), 10);
        if (i < editingRoute.stops.length - 1) {
          // Swap with next stop
          const temp = editingRoute.stops[i];
          editingRoute.stops[i] = editingRoute.stops[i + 1];
          editingRoute.stops[i + 1] = temp;
          renderEditStopsList();
        }
      });
    });

    // Wire up Remove buttons with confirmation
    listEl.querySelectorAll('.remove-stop-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const i = parseInt(this.getAttribute('data-index'), 10);
        const stopId = editingRoute.stops[i];
        const stop = window.CityBusData.getStopById(stopId);
        const stopName = stop ? stop.name : stopId;

        openConfirmModal(
          `Remove Stop from Route?`,
          `Are you sure you want to remove <strong>${stopName}</strong> from this route? The remaining stops will adjust their sequence accordingly.`,
          'Remove Stop',
          function () {
            editingRoute.stops.splice(i, 1);
            renderEditStopsList();
          }
        );
      });
    });
  }

  // 4. Populate Dropdown to Add a Stop to Route
  function populateAvailableStopsDropdown() {
    const select = document.getElementById('addStopToRouteSelect');
    if (!select) return;
    const allStops = window.CityBusData.getStops();
    select.innerHTML = '<option value="">-- Choose Stop to Add --</option>';

    allStops.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.landmark})`;
      select.appendChild(opt);
    });
  }

  // Button: Add Stop to Route
  const addStopBtn = document.getElementById('addStopToRouteBtn');
  if (addStopBtn) {
    addStopBtn.addEventListener('click', function () {
      const select = document.getElementById('addStopToRouteSelect');
      const stopId = select.value;
      if (!stopId) return;

      // Add to end of stops sequence
      editingRoute.stops.push(stopId);
      renderEditStopsList();
      select.value = '';
    });
  }

  // 5. Save Changes to Route
  const saveRouteChangesBtn = document.getElementById('saveRouteChangesBtn');
  if (saveRouteChangesBtn) {
    saveRouteChangesBtn.addEventListener('click', function () {
      if (!editingRoute) return;

      editingRoute.name = document.getElementById('editRouteName').value.trim();
      editingRoute.number = document.getElementById('editRouteNumber').value.trim();
      editingRoute.description = document.getElementById('editRouteDesc').value.trim();
      editingRoute.color = document.getElementById('editRouteColor').value;

      if (!editingRoute.name) {
        alert('Please enter a valid route name.');
        return;
      }

      window.CityBusData.updateRoute(editingRoute.id, editingRoute);
      editModal.classList.remove('active');
      renderRoutes();
    });
  }

  // 6. Add Brand New Route Modal Handling
  const addNewRouteBtn = document.getElementById('openAddRouteModalBtn');
  if (addNewRouteBtn) {
    addNewRouteBtn.addEventListener('click', function () {
      populateNewRouteStopsCheckboxList();
      addRouteModal.classList.add('active');
    });
  }

  function populateNewRouteStopsCheckboxList() {
    const container = document.getElementById('newRouteStopsCheckboxes');
    if (!container) return;
    const allStops = window.CityBusData.getStops();
    container.innerHTML = '';

    allStops.forEach(s => {
      const label = document.createElement('label');
      label.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; padding: 4px 0;';
      label.innerHTML = `
        <input type="checkbox" value="${s.id}" class="new-route-stop-check">
        <span><strong>${s.name}</strong> (${s.landmark})</span>
      `;
      container.appendChild(label);
    });
  }

  const createRouteBtn = document.getElementById('confirmCreateRouteBtn');
  if (createRouteBtn) {
    createRouteBtn.addEventListener('click', function () {
      const id = document.getElementById('newRouteId').value.trim();
      const number = document.getElementById('newRouteNumber').value.trim();
      const name = document.getElementById('newRouteName').value.trim();
      const desc = document.getElementById('newRouteDesc').value.trim();
      const color = document.getElementById('newRouteColor').value;

      if (!number || !name) {
        alert('Route Number and Name are required.');
        return;
      }

      const selectedStops = [];
      document.querySelectorAll('.new-route-stop-check:checked').forEach(chk => {
        selectedStops.push(chk.value);
      });

      if (selectedStops.length < 2) {
        alert('Please select at least 2 stops for the route sequence.');
        return;
      }

      window.CityBusData.addRoute({
        id: id || undefined,
        number: number,
        name: name,
        description: desc,
        color: color,
        stops: selectedStops,
        frequencyMinutes: 15,
        firstBus: '06:00 AM',
        lastBus: '10:00 PM',
        totalDistanceKm: 18.0,
        estimatedMinutes: 45
      });

      addRouteModal.classList.remove('active');
      renderRoutes();
    });
  }

  // 7. Delete Route with Confirmation
  function openDeleteRouteConfirm(routeId) {
    const route = window.CityBusData.getRouteById(routeId);
    if (!route) return;

    openConfirmModal(
      `Delete Route ${route.number}?`,
      `Are you sure you want to delete <strong>${route.number}: ${route.name}</strong>? This action will remove the route from the passenger search engine.`,
      'Delete Route',
      function () {
        window.CityBusData.deleteRoute(routeId);
        renderRoutes();
      }
    );
  }

  // 8. Reusable Confirmation Modal Helper
  function openConfirmModal(title, message, confirmBtnLabel, onConfirm) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').innerHTML = message;
    const btn = document.getElementById('confirmModalActionBtn');
    btn.textContent = confirmBtnLabel;
    activeCallbackOnConfirm = onConfirm;
    confirmModal.classList.add('active');
  }

  const confirmActionBtn = document.getElementById('confirmModalActionBtn');
  if (confirmActionBtn) {
    confirmActionBtn.addEventListener('click', function () {
      if (activeCallbackOnConfirm) {
        activeCallbackOnConfirm();
        activeCallbackOnConfirm = null;
      }
      confirmModal.classList.remove('active');
    });
  }

  // Close modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function () {
      if (editModal) editModal.classList.remove('active');
      if (addRouteModal) addRouteModal.classList.remove('active');
      if (confirmModal) confirmModal.classList.remove('active');
    });
  });

  // Initial render
  renderRoutes();
});
