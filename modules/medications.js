import { state, getVisibleRecords, saveState } from './state.js';
import { calculateNextAlarm } from './utils.js';

export function renderMedicationsTab() {
  const medications = getVisibleRecords('medications').slice().sort((a, b) => a.name.localeCompare(b.name));

  const html = `
    <div class="stack">
      <div class="form-card">
        <h4>Registrar medicación</h4>
        <div class="toolbar toolbar-grid">
          <div class="toolbar-field">
            <input id="medicationSearch" type="search" placeholder="Buscar medicación..." aria-label="Buscar medicación" />
          </div>
          <div class="toolbar-field">
            <select id="medicationFilter" class="toolbar-select">
              <option value="all">Todas</option>
              <option value="urgent">Urgentes</option>
              <option value="soon">Próximas</option>
              <option value="normal">Normales</option>
            </select>
          </div>
        </div>
        <form id="medicationForm" class="inline-form" data-mode="create">
          <label class="field-label">
            Nombre del medicamento
            <input type="text" name="name" placeholder="Ibuprofeno" required />
          </label>
          <label class="field-label">
            Dosis
            <input type="text" name="dosage" placeholder="5 mL" required />
          </label>
          <label class="field-label">
            Frecuencia
            <input type="text" name="frequency" placeholder="Cada 8 horas" required />
          </label>
          <label class="field-label">
            Hora de alarma
            <input type="time" name="scheduleTime" required />
          </label>
          <label class="field-label full-span">
            Indicaciones / notas
            <textarea name="notes" placeholder="Cuándo tomarlo, si se debe continuar, etc."></textarea>
          </label>
          <div class="full-span inline-actions">
            <button class="primary-btn" type="submit">Guardar medicamento</button>
            <button type="button" id="cancelMedicationEdit" class="ghost-btn" style="display:none;">Cancelar</button>
          </div>
        </form>
      </div>

      <div class="list-card">
        <h4>Alarmas y medicamentos</h4>
        ${medications.length ? `
          <div class="list">
            ${medications
              .map((item) => {
                const alarm = calculateNextAlarm(item);
                return `
                  <div class="item" data-medication-item data-id="${item.id}" data-level="${alarm.level}">
                    <div>
                      <strong>${item.name}</strong>
                      <small>${item.dosage} • ${item.frequency}</small>
                      <small>Hora: ${item.scheduleTime} • ${item.notes || 'Sin notas'}</small>
                      <small>Próxima alerta: ${alarm.label}</small>
                    </div>
                    <div>
                      <span class="badge ${alarm.level === 'urgente' ? 'danger' : alarm.level === 'próxima' ? 'warning' : 'success'}">${alarm.level}</span>
                      <div class="inline-button-row">
                        <button class="mini-button edit-btn" data-edit="medications" data-id="${item.id}">Editar</button>
                        <button class="mini-button" data-delete="medications" data-id="${item.id}">Eliminar</button>
                      </div>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        ` : '<div class="empty-state">No hay medicamentos registrados.</div>'}
      </div>
    </div>
  `;

  setTimeout(() => {
    const form = document.getElementById('medicationForm');
    const cancelButton = document.getElementById('cancelMedicationEdit');
    const searchInput = document.getElementById('medicationSearch');
    const filterSelect = document.getElementById('medicationFilter');

    const resetForm = () => {
      form.dataset.mode = 'create';
      form.dataset.recordId = '';
      form.reset();
      form.querySelector('button[type="submit"]').textContent = 'Guardar medicamento';
      cancelButton.style.display = 'none';
    };

    const applyFilters = () => {
      const query = searchInput.value.trim().toLowerCase();
      const filter = filterSelect ? filterSelect.value : 'all';

      document.querySelectorAll('[data-medication-item]').forEach((item) => {
        const text = item.innerText.toLowerCase();
        const level = item.dataset.level || 'normal';
        let visible = true;

        if (query && !text.includes(query)) visible = false;
        if (filter !== 'all' && level !== filter) visible = false;

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
          name: String(formData.get('name')).trim(),
          dosage: String(formData.get('dosage')).trim(),
          frequency: String(formData.get('frequency')).trim(),
          scheduleTime: String(formData.get('scheduleTime')).trim(),
          notes: String(formData.get('notes')).trim(),
          active: true,
        };

        if (form.dataset.mode === 'edit' && form.dataset.recordId) {
          const index = state.data.medications.findIndex((item) => item.id === form.dataset.recordId);
          if (index >= 0) {
            state.data.medications[index] = { ...state.data.medications[index], ...itemData };
          }
        } else {
          state.data.medications.push({
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

    document.querySelectorAll('[data-delete="medications"]').forEach((button) => {
      button.addEventListener('click', () => {
        const { id } = button.dataset;
        state.data.medications = state.data.medications.filter((item) => item.id !== id);
        saveState();
        window.renderCurrentView();
      });
    });

    document.querySelectorAll('[data-edit="medications"]').forEach((button) => {
      button.addEventListener('click', () => {
        const { id } = button.dataset;
        const item = state.data.medications.find((entry) => entry.id === id);
        if (!item) return;

        form.dataset.mode = 'edit';
        form.dataset.recordId = item.id;
        form.querySelector('[name="name"]').value = item.name || '';
        form.querySelector('[name="dosage"]').value = item.dosage || '';
        form.querySelector('[name="frequency"]').value = item.frequency || '';
        form.querySelector('[name="scheduleTime"]').value = item.scheduleTime || '';
        form.querySelector('[name="notes"]').value = item.notes || '';
        form.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
        cancelButton.style.display = 'inline-flex';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, 0);

  return html;
}
