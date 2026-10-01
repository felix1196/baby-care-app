import { defaultRecommendations } from './state.js';
import { capitalize } from './utils.js';

function buildCoachResponse({ symptom, mood, notes, ageRange, appetite, sleep }) {
  const symptomLabel = capitalize(symptom || 'general');
  const moodText = {
    alegre: 'se ve alegre y activo(a)',
    cansado: 'parece cansado(a) y necesita descansar más',
    irritable: 'está un poco irritable o sensible',
    preocupado: 'se ve más sensible y necesitará atención extra',
  }[mood] || 'se ve tranquilo(a)';

  const appetiteText = {
    bien: 'está comiendo bien y mantiene la ingesta',
    regular: 'está comiendo con menos ganas de lo normal',
    pobre: 'tiene poca hambre o se niega a comer',
  }[appetite] || 'su alimentación está más o menos estable';

  const sleepText = {
    bien: 'duerme bastante bien y se recupera',
    regular: 'duerme de forma irregular',
    pobre: 'ha tenido sueño fragmentado o agotador',
  }[sleep] || 'su descanso aún no es claro';

  const noteText = notes && notes.trim() ? `También me comentas que ${notes.trim()}.` : 'Estoy revisando su bienestar general.';
  const ageAdvice = {
    newborn: 'En esta etapa, valora mucho la hidratación, el descanso y cualquier cambio brusco en su estado.',
    infant: 'Mantén vigilancia y no dejes de observar cómo se comporta durante el día.',
    toddler: 'Cuando ya es más grande, ayuda mucho mantener una rutina tranquila y señales claras de alarma.',
  }[ageRange] || 'Ponte atenta a cualquier cambio importante en ánimo, sueño o alimentación.';

  const symptomAdvice = {
    gripe: 'Mantén la hidratación, un ambiente fresco y tranquilo, y vigila si aparecen fiebre alta o molestias respiratorias.',
    fiebre: 'Controla la temperatura según indicación del pediatra y revisa si hay otros signos de alarma.',
    tos: 'Mantenlo hidratado y observa si la tos empeora o si hay dificultad para respirar.',
    diarrea: 'Rehidrátalo bien y observa si hay vómitos, dolor fuerte o signos de deshidratación.',
    constipado: 'Limpia la nariz y ofrece líquidos; si hay respiración trabajosa, consulta.',
  }[symptom] || 'Busca calma, observación y atención si empeora.';

  return `
    <div class="assistant-summary">
      <strong>Resumen rápido:</strong>
      Hoy veo que tu bebé ${moodText}. También está ${appetiteText} y ${sleepText}.
    </div>
    <div class="assistant-body">
      <p><strong>${symptomLabel}:</strong> ${symptomAdvice}</p>
      <p>${noteText}</p>
      <p>${ageAdvice}</p>
      <p><strong>Qué observar:</strong> fiebre, dificultad para respirar, dolor intenso, vómitos persistentes, pérdida de ganas de comer o cambios drásticos en la conducta.</p>
      <p><strong>Qué hacer ahora:</strong> mantén un ambiente tranquilo, hidrata bien, sigue su rutina y consulta al pediatra si algo empeora o si la preocupación persiste.</p>
    </div>
  `;
}

export function renderRecommendationsTab() {
  const symptomOptions = Object.keys(defaultRecommendations);
  const selectedSymptom = symptomOptions[0];

  const html = `
    <div class="recommendation-grid">
      <div class="recommendation-panel">
        <h4>Selecciona un síntoma</h4>
        <form id="symptomForm" class="form-grid">
          <div class="toolbar-grid">
            <div class="toolbar-field">
              <label class="field-label">
                Situación
                <select name="symptom">
                  ${symptomOptions
                    .map((option) => `<option value="${option}" ${option === selectedSymptom ? 'selected' : ''}>${capitalize(option)}</option>`)
                    .join('')}
                </select>
              </label>
            </div>
            <div class="toolbar-field">
              <label class="field-label">
                ¿Cómo se ve hoy?
                <select name="mood">
                  <option value="alegre">Alegre</option>
                  <option value="cansado">Cansado</option>
                  <option value="irritable">Irritable</option>
                  <option value="preocupado">Preocupado</option>
                </select>
              </label>
            </div>
          </div>
          <button type="submit" class="primary-btn">Ver recomendaciones</button>
        </form>
      </div>

      <div class="recommendation-panel">
        <h4>Recomendaciones</h4>
        <ul class="list-plain" id="recommendationList">
          ${defaultRecommendations[selectedSymptom]
            .map((item) => `<li>${item}</li>`)
            .join('')}
        </ul>
      </div>
    </div>

    <div class="ai-card">
      <div class="ai-header">
        <div>
          <h4>Asistente BabyCare AI</h4>
          <p>Te ayuda a entender mejor cómo está tu bebé hoy.</p>
        </div>
      </div>

      <form id="aiAdviceForm" class="ai-form">
        <div class="ai-form-grid">
          <label class="field-label">
            Edad del bebé
            <select name="ageRange">
              <option value="newborn">0-6 meses</option>
              <option value="infant">6-12 meses</option>
              <option value="toddler">1-3 años</option>
            </select>
          </label>
          <label class="field-label">
            Alimentación
            <select name="appetite">
              <option value="bien">Bien</option>
              <option value="regular">Regular</option>
              <option value="pobre">Poca hambre</option>
            </select>
          </label>
          <label class="field-label">
            Sueño
            <select name="sleep">
              <option value="bien">Bien</option>
              <option value="regular">Regular</option>
              <option value="pobre">Muy poco</option>
            </select>
          </label>
        </div>

        <label class="field-label">
          ¿Cómo ves a tu bebé hoy?
          <textarea name="babyMood" rows="4" placeholder="Come bien, duerme tranquilo, está más sensible, se ve activo, etc." required></textarea>
        </label>
        <button type="submit" class="secondary-btn">Pedir consejo</button>
      </form>

      <div id="aiAdviceOutput" class="assistant-output">
        Selecciona un síntoma y comparte cómo lo ves para recibir un consejo personalizado.
      </div>
    </div>
  `;

  setTimeout(() => {
    const form = document.getElementById('symptomForm');
    const aiForm = document.getElementById('aiAdviceForm');
    const aiOutput = document.getElementById('aiAdviceOutput');
    const list = document.getElementById('recommendationList');

    const renderRecommendations = (symptom) => {
      list.innerHTML = defaultRecommendations[symptom]
        .map((item) => `<li>${item}</li>`)
        .join('');
    };

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const symptom = String(formData.get('symptom'));
        renderRecommendations(symptom);
      });
    }

    if (aiForm) {
      aiForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const symptom = form.querySelector('[name="symptom"]').value;
        const mood = form.querySelector('[name="mood"]').value;
        const ageRange = String(formData.get('ageRange'));
        const appetite = String(formData.get('appetite'));
        const sleep = String(formData.get('sleep'));
        const notes = String(formData.get('babyMood')).trim();

        aiOutput.innerHTML = buildCoachResponse({ symptom, mood, notes, ageRange, appetite, sleep });
      });
    }
  }, 0);

  return html;
}
