export const STORAGE_KEYS = {
  users: 'babyCareUsers',
  currentUser: 'babyCareCurrentUser',
  data: 'babyCareData',
};

export const defaultUsers = [
  {
    id: 'admin-1',
    name: 'Administrador',
    username: 'admin',
    email: 'admin@babycare.app',
    password: 'admin',
    role: 'admin',
  },
];

export const defaultRecommendations = {
  gripe: [
    'Mantén hidratado al bebé y ofrece líquidos frecuentes.',
    'Usa suero fisiológico o gotas recomendadas por el pediatra para la nariz.',
    'Asegura descanso y revisa fiebre o dificultad para respirar.',
  ],
  fiebre: [
    'Controla la temperatura con la indicación del pediatra.',
    'Mantén la habitación ventilada y al bebé hidratado.',
    'Si la fiebre dura más de 24-48 horas o hay otros signos de alarma, consulta.',
  ],
  tos: [
    'Ofrece líquidos tibios y mantén el ambiente húmedo.',
    'Evita el humo y revisa si la tos empeora durante la noche.',
    'Consulta si aparece falta de aire o si la tos es persistente.',
  ],
  diarrea: [
    'Rehidrata con soluciones de rehidratación oral según la indicación.',
    'Evita alimentos pesados y observa si hay sangre o vómitos.',
    'Busca ayuda si hay deshidratación marcada o dolor intenso.',
  ],
  constipado: [
    'Limpia la nariz con suero fisiológico y usa aspirador nasal si es necesario.',
    'Aumenta la ingesta de líquidos.',
    'Si hay fiebre o dificultad para respirar, consulta con el pediatra.',
  ],
};

function safeParse(dataKey, fallback) {
  try {
    const raw = localStorage.getItem(dataKey);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function loadState() {
  const users = safeParse(STORAGE_KEYS.users, defaultUsers);
  const parsedData = safeParse(STORAGE_KEYS.data, {
    appointments: [],
    studies: [],
    medications: [],
    growth: [],
  });

  if (!users || users.length === 0) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(defaultUsers));
    return { users: [...defaultUsers], currentUser: null, data: parsedData };
  }

  return { users, currentUser: safeParse(STORAGE_KEYS.currentUser, null), data: parsedData };
}

export const state = loadState();

export function saveState() {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
  localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(state.data));

  if (state.currentUser) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(state.currentUser));
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
}

export function ensureSeedData() {
  const ownerId = state.currentUser ? state.currentUser.id : null;

  if (!state.data.appointments || state.data.appointments.length === 0) {
    const today = new Date();
    const date = new Date(today.getTime() + 1000 * 60 * 60 * 24 * 5).toISOString().slice(0, 10);
    state.data.appointments = [
      {
        id: crypto.randomUUID(),
        ownerId: ownerId || 'admin-1',
        date,
        doctor: 'Dra. García',
        type: 'Control pediátrico',
        notes: 'Seguimiento del crecimiento y desarrollo.',
      },
    ];
  }

  if (!state.data.medications || state.data.medications.length === 0) {
    state.data.medications = [
      {
        id: crypto.randomUUID(),
        ownerId: ownerId || 'admin-1',
        name: 'Paracetamol',
        dosage: '5 mL',
        frequency: 'Cada 8 horas',
        scheduleTime: '08:00',
        notes: 'Tomar solo si hay fiebre y siguiendo indicación médica.',
        active: true,
      },
    ];
  }

  if (!state.data.growth || state.data.growth.length === 0) {
    state.data.growth = [
      {
        id: crypto.randomUUID(),
        ownerId: ownerId || 'admin-1',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
        weight: 7.8,
        height: 66,
        head: 42,
      },
    ];
  }

  if (!state.data.studies || state.data.studies.length === 0) {
    state.data.studies = [
      {
        id: crypto.randomUUID(),
        ownerId: ownerId || 'admin-1',
        name: 'Resultado de análisis',
        date: new Date().toISOString().slice(0, 10),
        category: 'Laboratorio',
        fileName: 'analisis.pdf',
        fileData: '',
      },
    ];
  }
}

export function getVisibleRecords(type) {
  if (!state.currentUser) return [];
  if (state.currentUser.role === 'admin') return state.data[type] || [];
  return (state.data[type] || []).filter((item) => item.ownerId === state.currentUser.id);
}

export function validateData() {
  if (!state.data) {
    state.data = { appointments: [], studies: [], medications: [], growth: [] };
  }

  Object.keys(state.data).forEach((key) => {
    if (!state.data[key]) {
      state.data[key] = [];
    }
  });
}
