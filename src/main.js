import { supabase } from './supabase.js';
import { MemoryGame, MAX_FALLOS } from './game.js';

const $ = (id) => document.getElementById(id);
const VISTAS = ['start', 'game', 'result', 'history'];

let usuario = null;
let juego = null;

// ---------- Navegación ----------
function mostrarVista(nombre) {
  VISTAS.forEach((v) => ($(v).hidden = v !== nombre));
  document.querySelectorAll('.tab').forEach((t) => {
    const activa = t.dataset.view === nombre || (nombre === 'result' && t.dataset.view === 'start');
    t.classList.toggle('active', activa);
  });
  if (nombre === 'history') cargarHistorial();
}

function mostrarSesion(user) {
  usuario = user;
  $('login-view').hidden = !!user;
  $('app-view').hidden = !user;
  if (user) {
    const meta = user.user_metadata || {};
    $('user-email').textContent = user.email || '';
    $('user-name').textContent = meta.full_name || meta.name || user.email || '';
  } else {
    if (juego) juego.abandonar();
  }
}

// ---------- Autenticación ----------
async function login() {
  $('login-error').textContent = '';
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) $('login-error').textContent = 'No se pudo iniciar sesión: ' + error.message;
}

async function logout() {
  await supabase.auth.signOut();
  mostrarSesion(null);
}

// ---------- Juego ----------
function actualizarHud({ fallos, parejas, segundos }) {
  $('hud-time').textContent = segundos;
  $('hud-fails').textContent = fallos;
  $('hud-pairs').textContent = parejas;
}

function nuevaPartida() {
  mostrarVista('game');
  juego.start();
}

async function finalizarPartida(datos) {
  $('result-title').textContent = datos.resultado === 'victoria' ? '🎉 ¡Has ganado!' : '💥 Has perdido';
  $('result-score').textContent = datos.puntuacion;
  $('result-time').textContent = datos.duracion;
  $('result-fails').textContent = datos.fallos;
  $('save-status').textContent = 'Guardando partida…';
  mostrarVista('result');

  const { error } = await supabase.from('partidas').insert({
    user_id: usuario.id,
    resultado: datos.resultado,
    puntuacion: datos.puntuacion,
    duracion: datos.duracion,
    fallos: datos.fallos,
    parejas: datos.parejas,
  });
  $('save-status').textContent = error
    ? 'No se pudo guardar la partida: ' + error.message
    : '✔ Partida guardada en tu historial.';
}

// ---------- Historial ----------
async function cargarHistorial() {
  const cuerpo = $('history-body');
  $('history-error').textContent = '';
  cuerpo.replaceChildren();

  const { data, error, count } = await supabase
    .from('partidas')
    .select('id, fecha, resultado, puntuacion, duracion', { count: 'exact' })
    .order('fecha', { ascending: false });

  if (error) {
    $('history-error').textContent = 'Error al cargar el historial: ' + error.message;
    return;
  }
  $('history-total').textContent = count ?? data.length;

  if (data.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'Todavía no has jugado ninguna partida.';
    tr.appendChild(td);
    cuerpo.appendChild(tr);
    return;
  }

  for (const p of data) {
    const tr = document.createElement('tr');
    const celdas = [
      new Date(p.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
      p.resultado === 'victoria' ? '🏆 Victoria' : '💥 Derrota',
      p.puntuacion,
      `${p.duracion} s`,
    ];
    for (const valor of celdas) {
      const td = document.createElement('td');
      td.textContent = valor; // textContent: sin riesgo de inyección HTML
      tr.appendChild(td);
    }
    cuerpo.appendChild(tr);
  }
}

// ---------- Inicio ----------
async function init() {
  $('max-fails').textContent = MAX_FALLOS;
  juego = new MemoryGame({ boardEl: $('board'), onUpdate: actualizarHud, onEnd: finalizarPartida });

  $('btn-login').addEventListener('click', login);
  $('btn-logout').addEventListener('click', logout);
  $('btn-start').addEventListener('click', nuevaPartida);
  $('btn-again').addEventListener('click', nuevaPartida);
  $('btn-to-history').addEventListener('click', () => mostrarVista('history'));
  $('btn-abandon').addEventListener('click', () => {
    juego.abandonar();
    mostrarVista('start');
  });
  document.querySelectorAll('.tab').forEach((t) =>
    t.addEventListener('click', () => {
      if (!$('game').hidden) juego.abandonar();
      mostrarVista(t.dataset.view);
    })
  );

  // Sesión persistente: se recupera al recargar la página
  const { data } = await supabase.auth.getSession();
  mostrarSesion(data.session?.user ?? null);
  if (data.session) mostrarVista('start');

  supabase.auth.onAuthStateChange((evento, session) => {
    if (evento === 'SIGNED_IN' && !usuario) {
      mostrarSesion(session.user);
      mostrarVista('start');
    } else if (evento === 'SIGNED_OUT') {
      mostrarSesion(null);
    }
  });
}

init();
