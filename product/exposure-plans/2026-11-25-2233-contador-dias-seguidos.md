# Plan de exposición: contador de días seguidos

**Hipótesis (de `product/hypotheses/contador-dias-seguidos.md`):** las personas que completaron una rutina en los últimos 14 días harán más días distintos con rutina completa si ven en `/cuenta` un contador de días seguidos, porque ver la racha les da una razón para no romperla.

## Secuencia de creencias

1. Ver la racha hace que la gente complete rutina en más días distintos.
2. Si la creencia 1 se sostiene, un premio por hito (insignia) sostiene el hábito más allá del contador.

La 2 no se puede interpretar si la 1 falla, por eso va después.

## Nivel 1: Contador de racha

- **Se revela:** una tarjeta en `/cuenta` con "Llevas N días seguidos". Sigue oculto: insignias, avisos y cualquier cambio de diseño fuera de la tarjeta.
- **Creencia:** ver cuántos días seguidos llevo completando una rutina me hace completar rutina en más días distintos.
- **Audiencia:** usuarios con al menos una rutina completada en los últimos 14 días.
- **Duración:** 2 semanas.
- **Validación:**
  - **Avanzar si:** ≥ 50% completa rutina en al menos 1 día más que en los 14 días previos.
  - **Iterar si:** entre 30% y 49%.
  - **Detener si:** < 30%, o el promedio de días con rutina completa no sube.
  - Con menos de 10 usuarios elegibles el resultado es inconcluso: extender 14 días.

## Nivel 2: Insignias por hito (acumula el Nivel 1)

- **Se revela:** insignias al llegar a 3, 7 y 14 días seguidos, visibles en la misma tarjeta. Sigue oculto: avisos por correo o push y rankings.
- **Creencia:** recibir una insignia por hito hace que la gente retome la racha cuando la rompe, en vez de abandonar la rutina.
- **Audiencia:** usuarios que ya ven el contador y han completado al menos 3 días seguidos alguna vez.
- **Duración:** 2 semanas.
- **Validación (umbrales por confirmar antes de construir):**
  - **Avanzar si:** ≥ 40% de quienes rompen una racha completan rutina de nuevo en los 3 días siguientes, y es mayor que la tasa observada en el Nivel 1.
  - **Detener si:** no supera la tasa del Nivel 1.

## Mecanismo de revelado: feature flags (preferencia indicada)

Encaja bien. El Nivel 1 se dirige a una cohorte por comportamiento (activos en 14 días) y el Nivel 2 a un subgrupo todavía más específico, algo que el desarrollo incremental no puede entregar. Se construye completo y se activa cada capa con su flag. La decisión final es de ingeniería.

## Validaciones paralelas

- **Honestidad del dato:** `completado` lo marca el usuario a mano. Una racha basada en lo declarado invita a marcar sin hacer la rutina, y eso inflaría las señales. Conviene revisar si el cumplimiento declarado cambia cuando aparece el contador.
- **Efecto de novedad:** no hay grupo de control (comparación antes/después), así que parte del alza puede ser curiosidad inicial.

## Preguntas abiertas

- ¿Cuántos usuarios cumplen hoy el criterio de audiencia? Con menos de 10, ambos niveles quedan inconclusos.
- ¿Una racha se rompe con un día UTC sin rutina? Para usuarios en México el corte de medianoche UTC cae por la tarde-noche, así que conviene decidir si se calcula en UTC o en hora local.
- ¿Los umbrales de 3, 7 y 14 días y el 40% del Nivel 2 son razonables?
