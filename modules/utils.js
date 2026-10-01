export function formatDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value + 'T12:00:00');
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function capitalize(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

export function calculateNextAlarm(medication) {
  const [hours, minutes] = String(medication.scheduleTime || '08:00').split(':').map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (next < now) {
    next.setDate(next.getDate() + 1);
  }

  const diffMinutes = Math.max(0, Math.round((next - now) / 60000));
  const level = diffMinutes <= 60 ? 'urgente' : diffMinutes <= 240 ? 'próxima' : 'normal';

  const hoursLeft = Math.floor(diffMinutes / 60);
  const minutesLeft = diffMinutes % 60;
  const label = diffMinutes <= 60 ? 'en menos de 1 hora' : `${hoursLeft}h ${minutesLeft}m`;

  return { label, level, minutesUntil: diffMinutes };
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}
