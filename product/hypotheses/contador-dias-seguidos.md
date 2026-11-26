# Hipótesis: contador de días seguidos con rutina completa

**Tests:** (sin `product/overview.md`; no hay registro de creencias. Creencia a registrar: "ver cuántos días seguidos llevo completando una rutina me motiva a volver cada día".)

**Creemos que** las personas con sesión en Soltura que ya completaron al menos una rutina en los últimos 14 días
**harán** más días distintos con una rutina completa cuando vean un contador de días seguidos en su tablero (`/cuenta`)
**porque** ver la racha les da una razón concreta para no romperla y volver al día siguiente.

**Sabremos que se sostiene si** al menos el 50% de esos usuarios completa rutina en más días distintos (UTC) durante los 14 días con el contador que en los 14 días previos (mínimo +1 día)
**en** 14 días desde que el contador se muestra.

**Sabremos que falló si** menos del 30% mejora, o el promedio de días con rutina completa no sube.

Entre 30% y 50%: iterar (ver regla de decisión).

## Alcance

- Esta hipótesis prueba **solo el contador**. Las insignias por hito (p. ej. 3, 7, 14 días) quedan como hipótesis siguiente y dependen de que esta se sostenga.

## Experimento

**Exposición mínima:** una tarjeta en `/cuenta` con "Llevas N días seguidos" (días consecutivos UTC con al menos una sesión `completado = true`, terminando hoy o ayer). Sin insignias, sin notificaciones, sin cambios de diseño más allá de la tarjeta.

**Instrumentación (sin tablas nuevas):**
- `routine_sessions` (`completado`, `created_at`): días distintos con rutina completa por usuario, antes y después.
- `visits`: separa "no volvió a la app" de "volvió y no completó".
- Fecha de lanzamiento del contador anotada en este documento para cortar las dos ventanas.

**Muestra y límites:**
- Con menos de 10 usuarios elegibles el resultado es inconcluso, no confirmatorio.
- Comparación antes/después sin grupo de control: puede haber efecto de novedad o de calendario. `completado` es declarado por el usuario.

## Regla de decisión (fijada de antemano)

| Resultado | Decisión |
|---|---|
| ≥ 50% mejora | Avanzar: hipótesis de insignias por hito |
| 30%–49% | Iterar: variar la presentación (p. ej. aviso de "no pierdas tu racha") y repetir 14 días |
| < 30% o sin alza promedio | Detener: no construir insignias sobre el contador |
| < 10 usuarios elegibles | Extender la ventana otros 14 días |

## Outcome

_Pendiente._
