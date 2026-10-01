import { state, saveState, validateData, ensureSeedData } from './modules/state.js';
import { renderAuth } from './modules/auth.js';
import { renderDashboardLayout, renderDashboardTab } from './modules/dashboard.js';
import { renderAppointmentsTab } from './modules/appointments.js';
import { renderStudiesTab } from './modules/studies.js';
import { renderMedicationsTab } from './modules/medications.js';
import { renderGrowthTab } from './modules/growth.js';
import { renderRecommendationsTab } from './modules/recommendations.js';

const app = document.getElementById('app');
let currentTab = 'dashboard';

function renderTab(tabKey) {
  switch (tabKey) {
    case 'dashboard':
      return renderDashboardTab();
    case 'citas':
      return renderAppointmentsTab();
    case 'estudios':
      return renderStudiesTab();
    case 'medicamentos':
      return renderMedicationsTab();
    case 'crecimiento':
      return renderGrowthTab();
    case 'recomendaciones':
      return renderRecommendationsTab();
    default:
      return renderDashboardTab();
  }
}

export function renderDashboardView() {
  app.innerHTML = renderDashboardLayout();

  const tabContent = document.getElementById('tabContent');
  const summaryGrid = document.querySelector('.summary-grid');

  if (summaryGrid) {
    summaryGrid.style.display = currentTab === 'dashboard' ? 'grid' : 'none';
  }

  tabContent.innerHTML = renderTab(currentTab);

  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === currentTab);
    button.addEventListener('click', () => {
      currentTab = button.dataset.tab;
      renderDashboardView();
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.currentUser = null;
    saveState();
    renderApp();
  });
}

export function renderDashboard() {
  currentTab = 'dashboard';
  renderDashboardView();
}

export function renderApp() {
  validateData();
  saveState();

  if (!state.currentUser) {
    renderAuth();
    return;
  }

  ensureSeedData();
  renderDashboardView();
}

window.renderApp = renderApp;
window.renderDashboard = renderDashboard;
window.renderCurrentView = renderDashboardView;

renderApp();
