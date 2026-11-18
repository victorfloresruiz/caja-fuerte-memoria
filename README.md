# 🔐 Memoria Fuerte

Videojuego web de memoria para el reto **La caja fuerte digital**. Inicias sesión con Google, juegas partidas y consultas tu historial, que se guarda en PostgreSQL (Supabase).

## Reglas del juego

- Hay 16 cartas boca abajo con 8 parejas de dibujos.
- En cada turno destapas dos cartas: si son iguales se quedan descubiertas; si no, cuenta como un fallo y se vuelven a tapar.
- **Ganas** si encuentras las 8 parejas con 10 fallos o menos. **Pierdes** al llegar al fallo número 11.
- Puntuación: victoria = `1000 - fallos × 50 - segundos × 3` (mínimo 100); derrota = `parejas encontradas × 50`.
- Puedes jugar todas las partidas que quieras.

## Tecnologías

- HTML5 y CSS3 (diseño adaptable a móvil y ordenador)
- JavaScript Vanilla (sin frameworks)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/): PostgreSQL, Auth (Google OAuth) y Row Level Security
- GitHub + despliegue en Vercel (o Netlify)

## Ejecutar en local

```bash
npm install
cp .env.example .env     # y rellena tus claves de Supabase
npm run dev
```

Variables de entorno (`.env`):

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_publica
```

> La clave `anon` es pública por diseño; la seguridad la dan las políticas RLS. **Nunca** subas la `service_role` ni el archivo `.env`.

## Configuración de Supabase

1. Crea un proyecto en supabase.com.
2. En **SQL Editor** ejecuta el contenido de `supabase/schema.sql` (crea la tabla `partidas` y las políticas RLS).
3. En **Project Settings > API** copia la *Project URL* y la clave *anon public* a tu `.env`.

## Configuración de Google OAuth

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto y configura la **pantalla de consentimiento OAuth**. Para que otras cuentas (el profesor) puedan entrar, pon la app en **Producción** o añádelas como usuarios de prueba.
2. En **Credenciales > Crear credenciales > ID de cliente de OAuth** elige *Aplicación web*.
3. En *URI de redireccionamiento autorizados* añade la URL de callback de Supabase: `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
4. En Supabase, **Authentication > Providers > Google**: actívalo y pega el *Client ID* y el *Client Secret*.
5. En Supabase, **Authentication > URL Configuration**:
   - *Site URL*: la URL pública desplegada.
   - *Redirect URLs*: añade la URL pública y `http://localhost:5173`.

## Despliegue (Vercel)

1. Sube el repositorio a GitHub.
2. En Vercel: **Add New > Project**, importa el repo (preset Vite).
3. Añade las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Despliega y copia la URL pública a *Site URL* y *Redirect URLs* en Supabase.

## Estructura

```
index.html          Pantallas (login, inicio, juego, resultado, historial)
src/main.js         Autenticación, navegación, guardado e historial
src/game.js         Mecánica del juego
src/supabase.js     Cliente de Supabase
src/style.css       Estilos responsive
supabase/schema.sql Tabla partidas + políticas RLS
```
