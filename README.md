Soltura: rutinas de movilidad de seis minutos para quien pasa ocho horas sentado.

## Reacción

**Entendió:** Para una no fue claro lo que ofrece la página, le pareció un título muy racional en vez de inspirador y muy sencilla. Pero para la otra le pareció claro el objetivo.

**No entendió:** ¿Por qué solamente para quien pasa 8 horas sentado? Y si lo quiere realizar una persona que apenas solo lleva 2 horas sentado.



Qué fue lo primero que dijo: "Ah, ok... ¿esto es como una app de estiramientos? Se ve limpio. 'Seis minutos para quien pasa ocho horas sentado' — sí, eso soy yo."

Qué no entendió:No sé si esto es una app que me descargo, una página web que uso ahí mismo, o un video que sigo. El widget del reloj a la derecha parece interactivo, pero nunca me quedó claro si al hacer clic en "Empezar mi rutina" pasa algo en la misma pantalla o me manda a otro lado. No entendí bien la diferencia entre "De pie" y "En tu silla" — ¿son dos rutinas distintas? ¿yo elijo una y ya, o hago las dos? Dice "una rutina, una vez al día" pero abajo lista tipo 6 ejercicios con "1:00" cada uno — ¿eso suma los 6 minutos?

Qué preguntó: ¿Esto es una app o una página que abro cada día? ¿Tengo que crear cuenta? ¿Cuánto cuesta / es gratis? ¿Sirve si ya tengo una lesión leve o dolor de espalda, o de plano no debería tocar eso?


## Cómo levantar el proyecto

Antes de empezar: Node.js con npm (probado con Node 24 y npm 11; la versión mínima **sin confirmar**, el proyecto no la fija) y Git.

1. Clona el repositorio y entra a la carpeta:
   ```bash
   git clone https://github.com/fabysmed07/mi-producto
   cd mi-producto
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea tu `.env.local` a partir de la plantilla:
   ```bash
   cp .env.example .env.local
   ```
   En PowerShell: `Copy-Item .env.example .env.local`.
4. Llena los valores de `.env.local`. **Pídeselos al dueño del proyecto**, y que sean los de la base de **desarrollo**: nunca uses los de producción (`CLAUDE.md` prohíbe desarrollar o probar contra ella). `.env.example` explica para qué sirve cada variable. `.env.local` no se sube a git; no lo compartas por chat ni lo pegues en issues o pull requests.
5. Levanta la app:
   ```bash
   npm run dev
   ```
   Se abre en http://localhost:3000.
6. Comprobación opcional de tipos (no hay tests ni ESLint; `lint` ejecuta `tsc --noEmit`):
   ```bash
   npm run lint
   ```

Para entender el proyecto, empieza por [docs/mapa-del-producto.md](docs/mapa-del-producto.md). Las reglas de trabajo (ramas, pull requests, migraciones) están en `CLAUDE.md`.

## Desarrollo

Next.js (App Router) + TypeScript.

```bash
npm install
npm run dev
```

- `/` es la landing y `/admin` el panel privado. Cualquiera puede registrarse en `/registro` e iniciar sesión en `/login`; tras entrar llegan a `/cuenta`; a `/admin` solo entran los emails de `ADMIN_EMAILS`.
- Los formularios de la landing envían a `app/api/signups` y `app/api/feedback`; esas rutas guardan en Supabase con `SUPABASE_SECRET_KEY` (solo servidor, en `.env.local`).
- Variables necesarias en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_EMAILS` (separados por coma).
