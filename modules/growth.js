import { state, getVisibleRecords, saveState } from './state.js';
import { formatDate } from './utils.js';

export function renderGrowthTab() {
  const growth = getVisibleRecords('growth').slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  const html = `
    <div class="stack">
      <div class="form-card">
        <h4>Registrar control de crecimiento</h4>
        <div class="toolbar toolbar-grid">
          <div class="toolbar-field">
            <input id="growthSearch" type="search" placeholder="Buscar controles..." aria-label="Buscar controles" />
          </div>
          <div class="toolbar-field">
            <select id="growthFilter" class="toolbar-select">
              <option value="all">Todos</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="365">Último año</option>
            </select>
          </div>
        </div>
        <form id="growthForm" class="inline-form" data-mode="create">
          <label class="field-label">
            Fecha
            <input type="date" name="date" required />
          </label>
          <label class="field-label">
            Peso (kg)
            <input type="number" name="weight" step="0.1" placeholder="7.5" required />
          </label>
          <label class="field-label">
            Talla (cm)
            <input type="number" name="height" step="0.1" placeholder="66" required />
          </label>
          <label class="field-label">
            Perímetro cefálico (cm)
            <input type="number" name="head" step="0.1" placeholder="42" required />
          </label>
          <div class="full-span inline-actions">
            <button class="primary-btn" type="submit">Guardar control</button>
            <button type="button" id="cancelGrowthEdit" class="ghost-btn" style="display:none;">Cancelar</button>
          </div>
        </form>
      </div>

      <div class="list-card">
        <h4>Checklist de crecimiento</h4>
        ${growth.length ? `
          <div class="list">
            ${growth
              .map(
                (item) => `
                  <div class="item" data-growth-item data-id="${item.id}" data-date="${item.date || ''}">
                    <div>
                      <strong>${formatDate(item.date)}</strong>
                      <small>Peso: ${item.weight} kg</small>
                      <small>Talla: ${item.height} cm</small>
                      <small>Perímetro cefálico: ${item.head} cm</small>
                    </div>
                    <div class="inline-button-row">
                      <button class="mini-button edit-btn" data-edit="growth" data-id="${item.id}">Editar</button>
                      <button class="mini-button" data-delete="growth" data-id="${item.id}">Eliminar</button>
                    </div>
                  </div>
                `,
              )
              .join('')}
          </div>
        ` : '<div class="empty-state">Sin controles registrados.</div>'}
      </div>
    </div>
  `;

  setTimeout(() => {
    const form = document.getElementById('growthForm');
    const cancelButton = document.getElementById('cancelGrowthEdit');
    const searchInput = document.getElementById('growthSearch');
    const filterSelect = document.getElementById('growthFilter');

    const resetForm = () => {
      form.dataset.mode = 'create';
      form.dataset.recordId = '';
      form.reset();
      form.querySelector('button[type="submit"]').textContent = 'Guardar control';
      cancelButton.style.display = 'none';
    };

    const applyFilters = () => {
      const query = searchInput.value.trim().toLowerCase();
      const filter = filterSelect ? filterSelect.value : 'all';
      const now = new Date();

      document.querySelectorAll('[data-growth-item]').forEach((item) => {
        const text = item.innerText.toLowerCase();
        const itemDate = item.dataset.date ? new Date(`${item.dataset.date}T12:00:00`) : null;
        let visible = true;

        if (query && !text.includes(query)) visible = false;
        if (filter !== 'all' && itemDate) {
          const days = (now - itemDate) / (1000 * 60 * 60 * 24);
          if (days > Number(filter)) visible = false;
        }

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
          weight: Number(formData.get('weight')),
          height: Number(formData.get('height')),
          head: Number(formData.get('head')),
        };

        if (form.dataset.mode === 'edit' && form.dataset.recordId) {
          const index = state.data.growth.findIndex((item) => item.id === form.dataset.recordId);
          if (index >= 0) {
            state.data.growth[index] = { ...state.data.growth[index], ...itemData };
          }
        } else {
          state.data.growth.push({
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

    document.querySelectorAll('[data-delete="growth"]').forEach((button) => {
      button.addEventListener('click', () => {
        const { id } = button.dataset;
        state.data.growth = state.data.growth.filter((item) => item.id !== id);
        saveState();
        window.renderCurrentView();
      });
    });

    document.querySelectorAll('[data-edit="growth"]').forEach((button) => {
      button.addEventListener('click', () => {
        const { id } = button.dataset;
        const item = state.data.growth.find((entry) => entry.id === id);
        if (!item) return;

        form.dataset.mode = 'edit';
        form.dataset.recordId = item.id;
        form.querySelector('[name="date"]').value = item.date || '';
        form.querySelector('[name="weight"]').value = item.weight || '';
        form.querySelector('[name="height"]').value = item.height || '';
        form.querySelector('[name="head"]').value = item.head || '';
        form.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
        cancelButton.style.display = 'inline-flex';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, 0);

  return html;
}
