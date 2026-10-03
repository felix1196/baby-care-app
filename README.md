# BabyCare Plus

Aplicación web para el seguimiento del bebé: citas, estudios, medicamentos, crecimiento y recomendaciones.

## Requisitos

- Navegador moderno
- Proyecto de Supabase creado
- URL del proyecto y anon key

## Configuración de Supabase

1. Crea un proyecto en Supabase.
2. En `Authentication` > `Providers` activa `Email`.
3. En `SQL Editor` ejecuta el contenido de `supabase/schema.sql`.
4. Abre `config.js` y agrega:

```js
window.BABYCARE_CONFIG = {
  appName: 'BabyCare Plus',
  supabaseUrl: 'https://TU_PROYECTO.supabase.co',
  supabaseAnonKey: 'TU_ANON_KEY',
};
```

5. Abre la app y regístrate.

## Modo local

Si no configuras Supabase, la app sigue funcionando con `localStorage` y una cuenta demo local.

## Credenciales demo locales

- Email: `admin@babycare.app`
- Contraseña: `admin`

## Publicación

El proyecto puede publicarse con GitHub Pages, Vercel, Netlify u otro hosting estático.
