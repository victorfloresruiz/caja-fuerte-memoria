// Lógica del juego de memoria. No toca el DOM de otras pantallas ni la base de datos:
// avisa mediante callbacks y main.js se encarga de guardar.

const EMOJIS = ['🔑', '🔒', '💎', '🪙', '🗝️', '🛡️', '💰', '📜'];
export const MAX_FALLOS = 10;
export const TOTAL_PAREJAS = EMOJIS.length;

function barajar(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function calcularPuntuacion({ resultado, parejas, fallos, duracion }) {
  if (resultado === 'victoria') {
    return Math.max(100, 1000 - fallos * 50 - duracion * 3);
  }
  return parejas * 50;
}

export class MemoryGame {
  constructor({ boardEl, onUpdate, onEnd }) {
    this.boardEl = boardEl;
    this.onUpdate = onUpdate;
    this.onEnd = onEnd;
    this.timerId = null;
    this.lockTimeout = null;
  }

  start() {
    this.stop();
    this.fallos = 0;
    this.parejas = 0;
    this.segundos = 0;
    this.abiertas = [];
    this.bloqueado = false;
    this.terminada = false;
    this.inicio = Date.now();

    this.boardEl.replaceChildren();
    const cartas = barajar([...EMOJIS, ...EMOJIS]);
    cartas.forEach((emoji, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'carta';
      btn.dataset.emoji = emoji;
      btn.setAttribute('aria-label', `Carta ${i + 1} boca abajo`);
      const cara = document.createElement('span');
      cara.className = 'cara';
      cara.textContent = emoji;
      btn.appendChild(cara);
      btn.addEventListener('click', () => this.voltear(btn));
      this.boardEl.appendChild(btn);
    });

    this.timerId = setInterval(() => {
      this.segundos = Math.floor((Date.now() - this.inicio) / 1000);
      this.onUpdate(this.estado());
    }, 500);
    this.onUpdate(this.estado());
  }

  estado() {
    return { fallos: this.fallos, parejas: this.parejas, segundos: this.segundos };
  }

  voltear(carta) {
    if (this.terminada || this.bloqueado) return;
    if (carta.classList.contains('abierta') || carta.classList.contains('acertada')) return;

    carta.classList.add('abierta');
    this.abiertas.push(carta);
    if (this.abiertas.length < 2) return;

    const [a, b] = this.abiertas;
    this.abiertas = [];

    if (a.dataset.emoji === b.dataset.emoji) {
      a.classList.replace('abierta', 'acertada');
      b.classList.replace('abierta', 'acertada');
      this.parejas++;
      this.onUpdate(this.estado());
      if (this.parejas === TOTAL_PAREJAS) this.terminar('victoria');
    } else {
      this.fallos++;
      this.bloqueado = true;
      this.onUpdate(this.estado());
      if (this.fallos > MAX_FALLOS) {
        // Se muestran las dos cartas un momento y se acaba la partida
        this.lockTimeout = setTimeout(() => this.terminar('derrota'), 700);
        return;
      }
      this.lockTimeout = setTimeout(() => {
        a.classList.remove('abierta');
        b.classList.remove('abierta');
        this.bloqueado = false;
      }, 800);
    }
  }

  terminar(resultado) {
    if (this.terminada) return;
    this.terminada = true;
    this.stop();
    const duracion = Math.max(1, Math.round((Date.now() - this.inicio) / 1000));
    const puntuacion = calcularPuntuacion({
      resultado,
      parejas: this.parejas,
      fallos: this.fallos,
      duracion,
    });
    this.onEnd({
      resultado,
      puntuacion,
      duracion,
      fallos: this.fallos,
      parejas: this.parejas,
    });
  }

  // Detiene temporizadores sin registrar la partida (abandono o reinicio)
  stop() {
    clearInterval(this.timerId);
    clearTimeout(this.lockTimeout);
    this.timerId = null;
    this.lockTimeout = null;
  }

  abandonar() {
    this.terminada = true;
    this.stop();
  }
}
