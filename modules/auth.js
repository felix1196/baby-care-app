import { state, saveState, ensureSeedData } from './state.js';

export function renderAuth() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="auth-screen">
      <section class="auth-illustration">
        <div class="auth-card">
          <h1>BabyCare Plus</h1>
          <p>
            Centraliza citas pediátricas, estudios, medicamentos y crecimiento del bebé en un solo lugar,
            con alertas útiles y recomendaciones de salud para cada etapa.
          </p>
          <div class="feature-list">
            <div class="feature-item"><span class="feature-bullet">✓</span><span>Control de citas y seguimiento médico.</span></div>
            <div class="feature-item"><span class="feature-bullet">✓</span><span>Estudios escaneados y documentados.</span></div>
            <div class="feature-item"><span class="feature-bullet">✓</span><span>Alarmas de medicación y crecimiento.</span></div>
            <div class="feature-item"><span class="feature-bullet">✓</span><span>Checklist de peso, talla y perímetro cefálico.</span></div>
          </div>
        </div>
      </section>
      <section class="auth-panel">
        <div class="auth-form">
          <div class="auth-tabs">
            <button class="auth-tab active" data-view="login" type="button">Iniciar sesión</button>
            <button class="auth-tab" data-view="register" type="button">Registrarse</button>
          </div>

          <form id="loginForm" class="form-grid">
            <label class="field-label">
              Usuario
              <input type="text" name="username" placeholder="admin" required />
            </label>

            <label class="field-label">
              Contraseña
              <input type="password" name="password" placeholder="••••••••" required />
            </label>

            <button type="submit" class="primary-btn">Entrar</button>
          </form>

          <form id="registerForm" class="form-grid" style="display:none;">
            <label class="field-label">
              Nombre completo
              <input type="text" name="name" placeholder="María López" required />
            </label>

            <label class="field-label">
              Usuario
              <input type="text" name="username" placeholder="maria" required />
            </label>

            <label class="field-label">
              Contraseña
              <input type="password" name="password" placeholder="••••••••" required />
            </label>

            <button type="submit" class="secondary-btn">Crear cuenta</button>
          </form>
        </div>
      </section>
    </div>
  `;

  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      document.querySelectorAll('.auth-tab').forEach((btn) => btn.classList.toggle('active', btn === tab));
      document.getElementById('loginForm').style.display = view === 'login' ? 'grid' : 'none';
      document.getElementById('registerForm').style.display = view === 'register' ? 'grid' : 'none';
    });
  });

  document.getElementById('loginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get('username')).trim();
    const password = String(formData.get('password')).trim();

    const user = state.users.find(
      (item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password,
    );

    if (!user) {
      alert('Credenciales incorrectas. Prueba admin / admin o crea una cuenta nueva.');
      return;
    }

    state.currentUser = { ...user };
    saveState();
    ensureSeedData();
    window.renderApp();
  });

  document.getElementById('registerForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name')).trim();
    const username = String(formData.get('username')).trim();
    const password = String(formData.get('password')).trim();

    if (!name || !username || !password) {
      alert('Completa todos los campos para registrarte.');
      return;
    }

    if (state.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      alert('Ese usuario ya existe. Intenta con otro nombre.');
      return;
    }

    const newUser = {
      id: crypto.randomUUID(),
      name,
      username,
      password,
      role: 'user',
    };

    state.users.push(newUser);
    state.currentUser = { ...newUser };
    saveState();
    ensureSeedData();
    window.renderApp();
  });
}
