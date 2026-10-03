import { state, saveState, ensureSeedData } from './state.js';
import {
  signInWithEmail,
  signUpWithEmail,
  resetPasswordForEmail,
  syncProfileToDatabase,
  getCurrentSupabaseUserProfile,
} from './database.js';

function findLocalUserByCredentials(identifier, password) {
  const normalized = String(identifier || '').trim().toLowerCase();

  return state.users.find((user) => {
    const usernameMatches = String(user.username || '').trim().toLowerCase() === normalized;
    const emailMatches = String(user.email || '').trim().toLowerCase() === normalized;
    return (usernameMatches || emailMatches) && String(user.password || '') === String(password || '');
  });
}

export function renderAuth() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="auth-screen">
      <section class="auth-illustration">
        <div class="auth-card">
          <div class="brand-lockup">
            <img src="./assets/logo.svg" alt="BabyCare Plus logo" class="brand-logo" />
            <div>
              <span class="brand-kicker">Salud infantil</span>
              <h1>BabyCare Plus</h1>
            </div>
          </div>
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
            <button class="auth-tab" data-view="recover" type="button">Recuperar</button>
          </div>

          <form id="loginForm" class="form-grid">
            <label class="field-label">
              Correo electrónico
              <input type="email" name="email" placeholder="tucorreo@mail.com" required />
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
              Correo electrónico
              <input type="email" name="email" placeholder="maria@mail.com" required />
            </label>

            <label class="field-label">
              Nombre de usuario
              <input type="text" name="username" placeholder="maria" required />
            </label>

            <label class="field-label">
              Contraseña
              <input type="password" name="password" placeholder="••••••••" required />
            </label>

            <button type="submit" class="secondary-btn">Crear cuenta</button>
          </form>

          <form id="recoverForm" class="form-grid" style="display:none;">
            <label class="field-label">
              Correo electrónico
              <input type="email" name="email" placeholder="tucorreo@mail.com" required />
            </label>

            <button type="submit" class="ghost-btn">Enviar enlace de recuperación</button>
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
      document.getElementById('recoverForm').style.display = view === 'recover' ? 'grid' : 'none';
    });
  });

  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email')).trim();
    const password = String(formData.get('password')).trim();

    const localUser = findLocalUserByCredentials(email, password);

    if (localUser) {
      state.currentUser = { ...localUser };
      saveState();
      ensureSeedData();
      window.renderApp();
      return;
    }

    const result = await signInWithEmail({ email, password });

    if (result.ok) {
      const user = result.user;
      const fallbackName = String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario');
      const normalizedUser = {
        id: user.id,
        name: fallbackName,
        username: user.user_metadata?.username || fallbackName.replace(/\s+/g, '').toLowerCase(),
        email: user.email,
        password,
        role: 'user',
      };

      const userIndex = state.users.findIndex((item) => item.id === normalizedUser.id || item.email === normalizedUser.email);
      if (userIndex >= 0) {
        state.users[userIndex] = { ...state.users[userIndex], ...normalizedUser };
      } else {
        state.users.push(normalizedUser);
      }

      await syncProfileToDatabase(normalizedUser);
      state.currentUser = { ...normalizedUser };
      saveState();
      ensureSeedData();
      window.renderApp();
      return;
    }

    alert(result.message || 'Credenciales incorrectas.');
  });

  document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name')).trim();
    const email = String(formData.get('email')).trim();
    const username = String(formData.get('username')).trim();
    const password = String(formData.get('password')).trim();

    if (!name || !email || !username || !password) {
      alert('Completa todos los campos para registrarte.');
      return;
    }

    const emailExists = state.users.some((user) => String(user.email || '').toLowerCase() === email.toLowerCase());
    const usernameExists = state.users.some((user) => String(user.username || '').toLowerCase() === username.toLowerCase());

    if (emailExists || usernameExists) {
      alert('Ese correo o nombre de usuario ya existe. Intenta con otros datos.');
      return;
    }

    const newUser = {
      id: crypto.randomUUID(),
      name,
      username,
      email,
      password,
      role: 'user',
    };

    const result = await signUpWithEmail({
      email,
      password,
      fullName: name,
      username,
    });

    if (result.ok) {
      await syncProfileToDatabase(newUser);
      state.users.push(newUser);
      state.currentUser = { ...newUser };
      saveState();
      ensureSeedData();
      window.renderApp();
      return;
    }

    if (result.message?.includes('Supabase no está configurado')) {
      state.users.push(newUser);
      state.currentUser = { ...newUser };
      saveState();
      ensureSeedData();
      window.renderApp();
      return;
    }

    alert(result.message || 'No se pudo crear la cuenta.');
  });

  document.getElementById('recoverForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email')).trim();

    if (!email) {
      alert('Ingresa un correo electrónico para recuperar el acceso.');
      return;
    }

    const result = await resetPasswordForEmail(email);
    alert(result.message || 'Verifica tu correo para continuar.');
  });
}
