import { state, getVisibleRecords } from './state.js';
import { formatDate, calculateNextAlarm } from './utils.js';

export function renderDashboardLayout() {
  const appointments = getVisibleRecords('appointments');
  const studies = getVisibleRecords('studies');
  const medications = getVisibleRecords('medications');
  const growth = getVisibleRecords('growth');

  const summaryCards = [
    { label: 'Citas', value: String(appointments.length), tone: 'primary' },
    { label: 'Estudios', value: String(studies.length), tone: 'success' },
    { label: 'Medicamentos', value: String(medications.length), tone: 'warning' },
    { label: 'Controles', value: String(growth.length), tone: 'default' },
  ];

  return `
    <div class="app-shell">
      <header class="app-header">
        <div class="brand">
          <div class="brand-mark">B</div>
          <div>
            <h2>BabyCare Plus</h2>
            <small>Seguimiento del bebé</small>
          </div>
        </div>
        <div class="header-actions">
          <span class="user-pill">👤 ${state.currentUser.name}</span>
          <button class="ghost-btn" id="logoutBtn" type="button">Cerrar sesión</button>
        </div>
      </header>

      <div class="layout">
        <aside class="sidebar">
          <ul class="nav-list">
            <li><button class="nav-btn active" data-tab="dashboard" type="button">Dashboard</button></li>
            <li><button class="nav-btn" data-tab="citas" type="button">Citas</button></li>
            <li><button class="nav-btn" data-tab="estudios" type="button">Estudios</button></li>
            <li><button class="nav-btn" data-tab="medicamentos" type="button">Medicamentos</button></li>
            <li><button class="nav-btn" data-tab="crecimiento" type="button">Crecimiento</button></li>
            <li><button class="nav-btn" data-tab="recomendaciones" type="button">Recomendaciones</button></li>
          </ul>
        </aside>

        <main class="content">
          <section class="panel">
            <div class="summary-grid">
              ${summaryCards
                .map(
                  (card) => `
                    <div class="summary-card">
                      <div class="label">${card.label}</div>
                      <div class="value">${card.value}</div>
                    </div>
                  `,
                )
                .join('')}
            </div>
            <div id="tabContent"></div>
          </section>
        </main>
      </div>
    </div>
  `;
}

export function renderDashboardTab() {
  const appointments = getVisibleRecords('appointments');
  const medications = getVisibleRecords('medications');
  const growth = getVisibleRecords('growth');
  const nextAppointment = appointments[0];
  const medicationAlerts = medications
    .filter((med) => med.active)
    .map((med) => {
      const nextDue = calculateNextAlarm(med);
      return { ...med, nextDue };
    })
    .sort((a, b) => a.nextDue.minutesUntil - b.nextDue.minutesUntil)
    .slice(0, 3);

  return `
    <div class="stack">
      <div class="section-header">
        <h3>Resumen general</h3>
      </div>

      <div class="recommendation-grid">
        <div class="recommendation-panel">
          <h4>Próxima cita</h4>
          ${nextAppointment ? `
            <div class="item">
              <div>
                <strong>${nextAppointment.type}</strong>
                <small>${formatDate(nextAppointment.date)}</small>
                <small>Doctor: ${nextAppointment.doctor}</small>
              </div>
              <span class="badge success">Confirmada</span>
            </div>
          ` : '<div class="empty-state">Aún no hay citas registradas.</div>'}
        </div>

        <div class="alarms-card">
          <h4>Alarmas de medicación</h4>
          ${medicationAlerts.length ? `
            <div class="list">
              ${medicationAlerts
                .map(
                  (med) => `
                    <div class="item">
                      <div>
                        <strong>${med.name}</strong>
                        <small>Dosis: ${med.dosage} • ${med.frequency}</small>
                        <small>Próxima alarma: ${med.nextDue.label}</small>
                      </div>
                      <span class="badge ${med.nextDue.level === 'urgente' ? 'danger' : 'warning'}">${med.nextDue.level}</span>
                    </div>
                  `,
                )
                .join('')}
            </div>
          ` : '<div class="empty-state">No hay medicamentos activos.</div>'}
        </div>
      </div>

      <div class="list-card">
        <h4>Últimos controles de crecimiento</h4>
        ${growth.length ? `
          <div class="list">
            ${growth
              .slice()
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 3)
              .map(
                (item) => `
                  <div class="item">
                    <div>
                      <strong>${formatDate(item.date)}</strong>
                      <small>Peso: ${item.weight} kg • Talla: ${item.height} cm • Cabeza: ${item.head} cm</small>
                    </div>
                  </div>
                `,
              )
              .join('')}
          </div>
        ` : '<div class="empty-state">Todavía no hay registros de crecimiento.</div>'}
      </div>
    </div>
  `;
}
