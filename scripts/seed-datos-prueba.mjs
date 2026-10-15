// Datos de prueba para /admin/metricas: 30 usuarios @datos-prueba.com con visitas y
// sesiones de rutina repartidas en las últimas 6 semanas (UTC).
//
//   node --env-file=.env.local scripts/seed-datos-prueba.mjs            # crea (aborta si ya existen)
//   node --env-file=.env.local scripts/seed-datos-prueba.mjs --reset    # borra y vuelve a crear
//   node --env-file=.env.local scripts/seed-datos-prueba.mjs --borrar   # solo borra
//
// Usa la llave secreta, solo para correr en local. Solo toca emails @datos-prueba.com.
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DOMAIN = '@datos-prueba.com';
const TOTAL = 30;
const DAYS = 42; // 6 semanas
const DAY_MS = 86_400_000;
const ROUTINES = ['cuello', 'espalda_baja', 'cadera', 'hombros', 'munecas', 'cuerpo_completo'];
// Probabilidad base de completar cada rutina (para que la tabla por rutina no salga plana).
const RATE = { cuello: 0.85, espalda_baja: 0.55, cadera: 0.6, hombros: 0.8, munecas: 0.9, cuerpo_completo: 0.4 };
const NOTAS = ['Hoy me dolía la lumbar', 'Me sentí mejor del cuello', 'Rutina corta, la hice entre juntas', 'Tenía mucha tensión en los hombros', 'Se me hizo largo'];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY (usa --env-file=.env.local).');
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// PRNG con semilla fija para que los datos sean reproducibles.
function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261015);
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const shuffle = (arr) => arr.map((v) => [rnd(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

async function listTestUsers() {
  const found = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    found.push(...data.users.filter((u) => u.email?.endsWith(DOMAIN)));
    if (data.users.length < 1000) return found;
  }
}

async function borrar() {
  const users = await listTestUsers();
  for (const u of users) {
    const { error } = await admin.auth.admin.deleteUser(u.id); // cascade limpia sesiones y visitas
    if (error) throw error;
  }
  console.log(`Borrados ${users.length} usuarios de prueba (y sus sesiones/visitas).`);
}

// Perfiles: cuántas semanas (de 6) usa, días por semana activa, sesiones y finalización.
const PROFILES = [
  { nombre: 'una sola vez', n: 9, semanas: [1, 1], dias: [1, 1], sesiones: [0, 1], factor: 0.5 },
  { nombre: 'ocasional', n: 9, semanas: [2, 3], dias: [1, 2], sesiones: [1, 5], factor: 0.8 },
  { nombre: 'recurrente', n: 8, semanas: [4, 5], dias: [2, 3], sesiones: [6, 15], factor: 1 },
  { nombre: 'muy activo', n: 4, semanas: [6, 6], dias: [4, 6], sesiones: [15, 25], factor: 1.1 },
];

function plan() {
  const now = Date.now();
  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const users = [];
  for (const p of PROFILES) {
    for (let i = 0; i < p.n; i++) {
      // Semana k = días [k*7, k*7+6] hacia atrás desde hoy. Los de "una sola vez" caen en cualquier semana.
      const weeks = shuffle([0, 1, 2, 3, 4, 5]).slice(0, int(...p.semanas));
      const days = new Set();
      for (const k of weeks) {
        const offsets = shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, int(...p.dias));
        for (const o of offsets) {
          const back = k * 7 + o;
          if (back < DAYS) days.add(back);
        }
      }
      const visitDays = [...days].sort((a, b) => b - a).map((back) => new Date(today.getTime() - back * DAY_MS));
      const nSes = int(...p.sesiones);
      const sessions = [];
      for (let s = 0; s < nSes; s++) {
        const day = pick(visitDays);
        let ts = day.getTime() + int(7, 19) * 3_600_000 + int(0, 59) * 60_000;
        if (ts > now) ts = now - int(1, 30) * 60_000;
        const rutina = pick(ROUTINES);
        const completado = rnd() < Math.min(0.97, RATE[rutina] * p.factor);
        sessions.push({
          rutina,
          completado,
          nota: rnd() < 0.2 ? pick(NOTAS) : null,
          created_at: new Date(ts).toISOString(),
        });
      }
      users.push({ perfil: p.nombre, visitDays, sessions });
    }
  }
  return shuffle(users);
}

async function crear() {
  const existing = await listTestUsers();
  if (existing.length > 0) {
    console.error(`Ya hay ${existing.length} usuarios ${DOMAIN}. Usa --reset para recrearlos o --borrar para quitarlos.`);
    process.exit(1);
  }

  const data = plan();
  const visits = [];
  const sessions = [];
  const altas = [];

  for (let i = 0; i < TOTAL; i++) {
    const u = data[i];
    const email = `usuario${String(i + 1).padStart(2, '0')}${DOMAIN}`;
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: randomBytes(24).toString('base64url'),
      email_confirm: true,
    });
    if (error) throw error;
    const id = created.user.id;

    // Alta = la mañana de su primera visita o sesión, para que "usuarios nuevos" por semana tenga sentido.
    const first = u.visitDays[0];
    altas.push({ id, created_at: new Date(first.getTime() + 8 * 3_600_000).toISOString() });
    for (const d of u.visitDays) visits.push({ user_id: id, day: d.toISOString().slice(0, 10) });
    for (const s of u.sessions) sessions.push({ user_id: id, ...s });
  }

  for (let i = 0; i < visits.length; i += 500) {
    const { error } = await admin.from('visits').insert(visits.slice(i, i + 500));
    if (error) throw error;
  }
  for (let i = 0; i < sessions.length; i += 500) {
    const { error } = await admin.from('routine_sessions').insert(sessions.slice(i, i + 500));
    if (error) throw error;
  }
  console.log(`Creados ${TOTAL} usuarios, ${visits.length} visitas y ${sessions.length} sesiones.`);

  // createUser no deja fijar created_at: se ajusta con SQL (dato, no estructura).
  const values = altas.map((a) => `('${a.id}'::uuid, '${a.created_at}'::timestamptz)`).join(',\n  ');
  const sql = `update auth.users u set created_at = v.c from (values\n  ${values}\n) as v(id, c) where u.id = v.id;`;
  const file = join(tmpdir(), `seed-altas-${Date.now()}.sql`);
  try {
    writeFileSync(file, sql);
    execFileSync(process.platform === 'win32' ? 'supabase.exe' : 'supabase', ['db', 'query', '--linked', '-f', file], { stdio: 'inherit' });
    console.log('Fechas de alta ajustadas.');
  } catch {
    const out = join(process.cwd(), 'scripts', 'altas-datos-prueba.sql');
    writeFileSync(out, sql + '\n');
    console.log(`\nNo pude ajustar created_at con la CLI (¿falta supabase login o supabase link?). Ejecuta ${out} en el SQL Editor de Supabase.`);
  } finally {
    try { unlinkSync(file); } catch {}
  }
}

const args = process.argv.slice(2);
if (args.includes('--borrar')) {
  await borrar();
} else {
  if (args.includes('--reset')) await borrar();
  await crear();
}
