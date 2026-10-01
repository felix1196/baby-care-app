import { state, getVisibleRecords, saveState } from './state.js';
import { formatDate } from './utils.js';

export function renderAppointmentsTab() {
  const appointments = getVisibleRecords('appointments').slice().sort((a, b) => new Date(a.date) - new Date(b.date));

  const html = `
    <div class="stack">
      <div class="form-card">
        <h4>Agregar cita</h4>
        <div class="toolbar toolbar-grid">
          <div class="toolbar-field">
            <input id="appointmentSearch" type="search" placeholder="Buscar citas..." aria-label="Buscar citas" />
          </div>
          <div class="toolbar-field">
            <select id="appointmentFilter" class="toolbar-select">
              <option value="all">Todas</option>
              <option value="upcoming">Próximas</option>
              <option value="today">Hoy</option>
              <option value="withNotes">Con observaciones</option>
            </select>
          </div>
        </div>
        <form id="appointmentForm" class="inline-form" data-mode="create">
          <label class="field-label">
            Fecha
            <input type="date" name="date" required />
          </label>
          <label class="field-label">
            Tipo
            <input type="text" name="type" placeholder="Control, revisión, estudio" required />
          </label>
          <label class="field-label">
            Doctor
            <input type="text" name="doctor" placeholder="Dra. García" required />
          </label>
          <label class="field-label">
            Observaciones
            <textarea name="notes" placeholder="Síntomas, seguimiento o indicaciones..."></textarea>
          </label>
          <div class="full-span inline-actions">
            <button type="submit" class="primary-btn">Guardar cita</button>
            <button type="button" id="cancelAppointmentEdit" class="ghost-btn" style="display:none;">Cancelar</button>
          </div>
        </form>
      </div>

      <div class="list-card">
        <h4>Listado de citas</h4>
        ${appointments.length ? `
          <div class="list">
            ${appointments
              .map(
                (item) => `
                  <div class="item" data-appointment-item data-id="${item.id}" data-date="${item.date || ''}" data-notes="${String(item.notes || '').trim()}">
                    <div>
                      <strong>${item.type}</strong>
                      <small>${formatDate(item.date)}</small>
                      <small>Doctor: ${item.doctor}</small>
                      <small>${item.notes || 'Sin observaciones'}</small>
                    </div>
                    <div class="inline-button-row">
                      <button class="mini-button edit-btn" data-edit="appointments" data-id="${item.id}">Editar</button>
                      <button class="mini-button" data-delete="appointments" data-id="${item.id}">Eliminar</button>
                    </div>
                  </div>
                `,
              )
              .join('')}
          </div>
        ` : '<div class="empty-state">No hay citas.</div>'}
      </div>
    </div>
  `;

  setTimeout(() => {
    const form = document.getElementById('appointmentForm');
    const cancelButton = document.getElementById('cancelAppointmentEdit');
    const searchInput = document.getElementById('appointmentSearch');
    const filterSelect = document.getElementById('appointmentFilter');

    const resetForm = () => {
      form.dataset.mode = 'create';
      form.dataset.recordId = '';
      form.reset();
      form.querySelector('button[type="submit"]').textContent = 'Guardar cita';
      cancelButton.style.display = 'none';
    };

    const applyFilters = () => {
      const query = searchInput.value.trim().toLowerCase();
      const filter = filterSelect ? filterSelect.value : 'all';
      const today = new Date().toISOString().slice(0, 10);

      document.querySelectorAll('[data-appointment-item]').forEach((item) => {
        const text = item.innerText.toLowerCase();
        const itemDate = item.dataset.date || '';
        const hasNotes = Boolean(String(item.dataset.notes || '').trim());

        let visible = true;

        if (query && !text.includes(query)) visible = false;
        if (filter === 'upcoming' && itemDate && itemDate < today) visible = false;
        if (filter === 'today' && itemDate !== today) visible = false;
        if (filter === 'withNotes' && !hasNotes) visible = false;

        item.style.display = visible ? 'flex' : 'none';
      });
    };

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', applyFilters);
    }

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const itemData = {
          date: formData.get('date'),
          type: String(formData.get('type')).trim(),
          doctor: String(formData.get('doctor')).trim(),
          notes: String(formData.get('notes')).trim(),
        };

        if (form.dataset.mode === 'edit' && form.dataset.recordId) {
          const index = state.data.appointments.findIndex((item) => item.id === form.dataset.recordId);
          if (index >= 0) {
            state.data.appointments[index] = { ...state.data.appointments[index], ...itemData };
          }
        } else {
          state.data.appointments.push({
            id: crypto.randomUUID(),
            ownerId: state.currentUser.id,
            ...itemData,
          });
        }

        saveState();
        resetForm();
        window.renderCurrentView();
      });
    }

    cancelButton.addEventListener('click', resetForm);

    document.querySelectorAll('[data-delete="appointments"]').forEach((button) => {
      button.addEventListener('click', () => {
        const { id } = button.dataset;
        state.data.appointments = state.data.appointments.filter((item) => item.id !== id);
        saveState();
        window.renderCurrentView();
      });
    });

    document.querySelectorAll('[data-edit="appointments"]').forEach((button) => {
      button.addEventListener('click', () => {
        const { id } = button.dataset;
        const item = state.data.appointments.find((entry) => entry.id === id);
        if (!item) return;

        form.dataset.mode = 'edit';
        form.dataset.recordId = item.id;
        form.querySelector('[name="date"]').value = item.date || '';
        form.querySelector('[name="type"]').value = item.type || '';
        form.querySelector('[name="doctor"]').value = item.doctor || '';
        form.querySelector('[name="notes"]').value = item.notes || '';
        form.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
        cancelButton.style.display = 'inline-flex';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, 0);

  return html;
}
