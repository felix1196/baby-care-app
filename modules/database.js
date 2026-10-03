export function getConfig() {
  const config = window.BABYCARE_CONFIG || {};

  return {
    appName: config.appName || 'BabyCare Plus',
    supabaseUrl: config.supabaseUrl || '',
    supabaseAnonKey: config.supabaseAnonKey || '',
  };
}

export function getSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getConfig();

  if (!supabaseUrl || !supabaseAnonKey || !window.supabase) {
    return null;
  }

  return window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function isSupabaseReady() {
  return Boolean(getSupabaseClient());
}

export async function signInWithEmail({ email, password }) {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: false, message: 'Supabase no está configurado aún. Usa la cuenta local o configura tus credenciales.' };
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: error.message || 'No se pudo iniciar sesión.' };
  }

  return {
    ok: true,
    user: data.user,
    session: data.session,
  };
}

export async function signUpWithEmail({ email, password, fullName, username }) {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: false, message: 'Supabase no está configurado aún.' };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message || 'No se pudo crear la cuenta.' };
  }

  return { ok: true, user: data.user };
}

export async function resetPasswordForEmail(email) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'La recuperación por correo requiere la configuración de Supabase.',
    };
  }

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/index.html`,
  });

  if (error) {
    return { ok: false, message: error.message || 'No se pudo enviar el correo.' };
  }

  return {
    ok: true,
    message: 'Revisa tu correo para restablecer la contraseña.',
  };
}

export async function syncProfileToDatabase(profile) {
  const client = getSupabaseClient();

  if (!client || !profile?.id) {
    return { ok: false, message: 'No hay cliente de base de datos configurado.' };
  }

  try {
    const { error } = await client.from('profiles').upsert(
      {
        id: profile.id,
        full_name: profile.name,
        username: profile.username,
        email: profile.email || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (error) {
      return { ok: false, message: error.message || 'No se pudo sincronizar el perfil.' };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, message: 'Sincronización local disponible; la base de datos aún no está creada.' };
  }
}

export async function getCurrentSupabaseUserProfile() {
  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError && profileError.code !== 'PGRST116') {
    return null;
  }

  return {
    id: user.id,
    name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
    username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'usuario',
    email: user.email,
    role: 'user',
  };
}
