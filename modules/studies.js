import { state, getVisibleRecords, saveState } from './state.js';
import { formatDate, readFileAsDataURL } from './utils.js';

export function renderStudiesTab() {
  const studies = getVisibleRecords('studies').slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  const html = `
    <div class="stack">
      <div class="form-card">
        <h4>Subir estudio o escaneo</h4>
        <div class="toolbar toolbar-grid">
          <div class="toolbar-field">
            <input id="studySearch" type="search" placeholder="Buscar estudios..." aria-label="Buscar estudios" />
          </div>
          <div class="toolbar-field">
            <select id="studyFilter" class="toolbar-select">
              <option value="all">Todos</option>
              <option value="Laboratorio">Laboratorio</option>
              <option value="Imágenes">Imágenes</option>
              <option value="Consulta">Consulta</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>
        <form id="studyForm" class="inline-form" data-mode="create">
          <label class="field-label">
            Nombre del estudio
            <input type="text" name="name" placeholder="Ecografía, laboratorio, radiografía" required />
          </label>
          <label class="field-label">
            Tipo
            <select name="category">
              <option value="Laboratorio">Laboratorio</option>
              <option value="Imágenes">Imágenes</option>
              <option value="Consulta">Consulta</option>
              <option value="Otro">Otro</option>
            </select>
          </label>
          <label class="field-label">
            Fecha
            <input type="date" name="date" required />
          </label>
          <label class="field-label">
            Documento o imagen escaneada
            <input type="file" name="file" accept="image/*,.pdf" />
          </label>
          <div class="full-span inline-actions">
            <button type="submit" class="primary-btn">Guardar estudio</button>
            <button type="button" id="cancelStudyEdit" class="ghost-btn" style="display:none;">Cancelar</button>
          </div>
        </form>
      </div>

      <div class="list-card">
        <h4>Documentos cargados</h4>
        ${studies.length ? `
          <div class="list">
            ${studies
              .map(
                (item) => `
                  <div class="item" data-study-item data-id="${item.id}" data-category="${item.category || 'Otro'}">
                    <div>
                      <strong>${item.name}</strong>
                      <small>${item.category} • ${formatDate(item.date)}</small>
                      ${item.fileData ? (item.fileData.startsWith('data:image/') ? `<img class="study-preview" src="${item.fileData}" alt="${item.name}" />` : `<a href="${item.fileData}" target="_blank" rel="noreferrer">Ver archivo PDF o documento</a>`) : '<small>No hay archivo adjunto</small>'}
                    </div>
                    <div class="inline-button-row">
                      <button class="mini-button edit-btn" data-edit="studies" data-id="${item.id}">Editar</button>
                      <button class="mini-button" data-delete="studies" data-id="${item.id}">Eliminar</button>
                    </div>
                  </div>
                `,
              )
              .join('')}
          </div>
        ` : '<div class="empty-state">Todavía no se han cargado estudios.</div>'}
      </div>
    </div>
  `;

  setTimeout(() => {
    const form = document.getElementById('studyForm');
    const cancelButton = document.getElementById('cancelStudyEdit');
    const searchInput = document.getElementById('studySearch');
    const filterSelect = document.getElementById('studyFilter');

    const resetForm = () => {
      form.dataset.mode = 'create';
      form.dataset.recordId = '';
      form.reset();
      form.querySelector('button[type="submit"]').textContent = 'Guardar estudio';
      cancelButton.style.display = 'none';
    };

    const applyFilters = () => {
      const query = searchInput.value.trim().toLowerCase();
      const filter = filterSelect ? filterSelect.value : 'all';

      document.querySelectorAll('[data-study-item]').forEach((item) => {
        const text = item.innerText.toLowerCase();
        const category = item.dataset.category || 'Otro';
        let visible = true;

        if (query && !text.includes(query)) visible = false;
        if (filter !== 'all' && category !== filter) visible = false;

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
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const file = formData.get('file');
        let fileData = '';
        let fileName = 'sin-archivo.pdf';

        if (file && file.size > 0) {
          fileName = file.name;
          fileData = await readFileAsDataURL(file);
        }

        const itemData = {
          name: String(formData.get('name')).trim(),
          category: String(formData.get('category')),
          date: formData.get('date'),
          fileName,
          fileData,
        };

        if (form.dataset.mode === 'edit' && form.dataset.recordId) {
          const index = state.data.studies.findIndex((item) => item.id === form.dataset.recordId);
          if (index >= 0) {
            state.data.studies[index] = { ...state.data.studies[index], ...itemData };
          }
        } else {
          state.data.studies.push({
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

    document.querySelectorAll('[data-delete="studies"]').forEach((button) => {
      button.addEventListener('click', () => {
        const { id } = button.dataset;
        state.data.studies = state.data.studies.filter((item) => item.id !== id);
        saveState();
        window.renderCurrentView();
      });
    });

    document.querySelectorAll('[data-edit="studies"]').forEach((button) => {
      button.addEventListener('click', () => {
        const { id } = button.dataset;
        const item = state.data.studies.find((entry) => entry.id === id);
        if (!item) return;

        form.dataset.mode = 'edit';
        form.dataset.recordId = item.id;
        form.querySelector('[name="name"]').value = item.name || '';
        form.querySelector('[name="category"]').value = item.category || 'Laboratorio';
        form.querySelector('[name="date"]').value = item.date || '';
        form.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
        cancelButton.style.display = 'inline-flex';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, 0);

  return html;
}
