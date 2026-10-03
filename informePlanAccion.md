# Plan de acción — Krono

Fecha: 3 de octubre de 2026. Estado: **aprobado por el usuario e implementado; QA de dispositivo real pendiente**. Este documento conserva la propuesta original; los resultados y límites actuales están en `informeValidacion.md`.

## 1. Recomendación

Corregir primero los fallos que afectan datos, errores visibles y recordatorios. Después completar la agenda y el calendario internos, mejorar accesibilidad y modernizar lo que todavía quede pendiente. Mantener React, TypeScript, Capacitor y SQLite: no hay evidencia que justifique reescribir la aplicación o cambiar de base de datos.

Las actualizaciones de herramientas y plataforma se realizarían en entregas separadas de las correcciones funcionales. El plan incluye puntos de validación para detener una migración incompatible sin bloquear las mejoras independientes.

Este documento amplía `informePrevio.md`. En esta entrega no se cambiaron dependencias, código de aplicación ni esquema de datos; no se ejecutaron comandos Git. Solo se prepara el plan y se registra la preferencia de mensajes de commit en español.

## 2. Condiciones de trabajo propuestas

- La aplicación seguirá siendo local, sin backend, autenticación ni API externa.
- DAILY seguirá significando una tarea de 24 horas reales, no una tarea recurrente. Sus avisos mantendrán intervalos de 2 horas.
- DEADLINE conservará el intervalo configurable. Los eventos no tendrán completado ni notificaciones.
- Se conservarán los widgets Android existentes y se corregirá su integración; no sustituyen la agenda interna.
- Para el alcance inicial, propongo tratar la web como vista de desarrollo con aviso de almacenamiento temporal. Convertirla en producto persistente sería una ampliación explícita.
- Ningún agente ejecutará comandos Git. El usuario realizará los commits; cada entrega coherente incluirá una única propuesta Conventional Commit con descripción en español.
- No desinstalar la app para probar una actualización con datos: hacerlo invalidaría la prueba de conservación.

## 3. Fases y orden de ejecución

Los esfuerzos son relativos, no plazos comprometidos. Orden recomendado: **0 → 1 → 2 → 3 → 4 → 5 → 6**. El bloque de herramientas web de la sección 4 puede ejecutarse después de la fase 0, en una entrega aislada. La migración nativa se decide en fase 0 y se valida antes de cerrar el trabajo nativo de fase 3.

### Fase 0 — Reproducción, respaldo y compatibilidad

**Objetivo:** convertir los riesgos del informe en casos comprobables y asegurar una base recuperable. Esfuerzo medio.

1. Registrar Node/npm, Java, SDK, Gradle y versiones resueltas del lockfile. Ya se verificaron Node 24.18.0 y npm 11.16.0; el entorno Java/SDK todavía requiere comprobación.
2. Reproducir en Android el cambio de completado desde un widget y comprobar los recordatorios pendientes.
3. Preparar datos de prueba: tareas de ambos tipos, completadas, vencidas, eventos de varios días, colores y ajustes no predeterminados.
4. Conservar una copia consistente de los datos antes de modificar persistencia. Si SQLite utiliza WAL, no copiar únicamente el archivo principal mientras esté escribiéndose: usar un mecanismo de respaldo consistente o cerrar/checkpoint según el adaptador.
5. Verificar compilación Gradle y arranque de la versión actual; guardar resultados para comparar después.
6. Confirmar el Android mínimo que interesa soportar y si la web será solo desarrollo. Estas decisiones condicionan la modernización nativa y la persistencia web, no los arreglos de errores de interfaz.

**Salida:** matriz de compatibilidad, reproducción de defectos y respaldo verificado. Si el entorno Android no está disponible, registrar el bloqueo y continuar los cambios independientes, sin declarar resuelto el comportamiento nativo.

### Fase 1 — Errores visibles y protección de acciones

**Objetivo:** evitar que un fallo parezca una lista vacía o una operación correcta. Esfuerzo medio.

- Consumir los errores expuestos por `useTasks` y `useEvents`; mostrar un mensaje y botón Reintentar.
- Capturar rechazos al completar y eliminar. Marcar la operación en curso por elemento y evitar dobles pulsaciones.
- Impedir que Ajustes guarde un valor predeterminado después de fallar su lectura.
- Incorporar confirmación de borrado con nombre del elemento. Es la opción inicial recomendada; «Deshacer» quedaría para una entrega posterior porque requiere restaurar también efectos secundarios.
- Añadir foco inicial, contención y devolución del foco al diálogo; anunciar errores de formulario.
- Identificar el almacenamiento temporal al ejecutar la variante web actual.

**Archivos principales:** hooks y listas de tareas/eventos, `SettingsPage.tsx`, `Modal.tsx`, formularios.

**Aceptación:** con repositorios simulados que fallen, aparece un error recuperable; la UI no comunica éxito, no borra datos ante Cancelar y no duplica acciones. El diálogo funciona con teclado. No debe haber rechazos sin manejar en estos flujos.

### Fase 2 — Servicios, fechas y persistencia robusta

**Objetivo:** disponer de una base común antes de corregir efectos nativos. Esfuerzo alto.

1. Extraer servicios de aplicación para crear, editar, completar, reabrir y eliminar. Los repositorios manejarán acceso a datos; los servicios coordinarán persistencia, notificaciones y actualización de widgets.
2. Establecer validaciones únicas: títulos, fechas válidas normalizadas a UTC, plazo posterior al inicio, colores e intervalos finitos positivos dentro de los límites admitidos por ajustes.
3. Centralizar conversiones de `datetime-local`, duración DAILY, valores predeterminados e idioma de encabezados.
4. Hacer recuperable la inicialización: limpiar la promesa rechazada, impedir acceso accidental a un simulador en Android y ofrecer reintento.
5. Definir un único contrato de esquema y migraciones para JavaScript y Android. Ambos consumidores deben respetar la misma versión y el mismo archivo; el widget no debe introducir una migración alternativa.
6. Aplicar cambios de esquema en transacciones verificadas con la API real del adaptador. Si se necesita un registro de sincronización o IDs, crearlo con una migración aditiva, sin reiniciar tablas.
7. Sustituir el simulador SQL para pruebas de persistencia por pruebas contra un motor real; mantener dobles pequeños para fallos de servicios/UI. Verificar también SQLite Android con instrumentación.

**Archivos principales:** `src/database`, `src/services`, `src/utils/date.ts`, formularios y helper SQLite Android.

**Aceptación:** instalación nueva y actualización conservan IDs, estados, colores y ajustes; un fallo de migración no deja media migración aplicada. DAILY dura exactamente 24 horas incluso en cambios horarios de America/Santiago. No se pierden tareas si una notificación falla después del guardado.

### Fase 3 — Recordatorios coherentes entre app y widgets

**Objetivo:** que todas las entradas respeten el mismo estado persistido. Esfuerzo alto; mayor riesgo técnico del plan.

- Antes de implementar, validar cómo cancelar/programar desde Kotlin usando la versión elegida del plugin. No asumir que sus APIs internas son estables ni que React estará activo cuando se use un widget.
- Definir un adaptador nativo común para las operaciones de recordatorios. Si el plugin no expone lo necesario para el receiver, documentar y probar una extensión mínima; no mantener dos planificadores independientes que generen avisos duplicados.
- Persistir el estado de sincronización y una asociación fiable entre tareas y IDs. Mantener compatibilidad para cancelar avisos ya creados con el esquema anterior.
- Al completar/eliminar desde el widget, cancelar los pendientes sin esperar a abrir la app. Al reabrir, reconstruir solo avisos futuros.
- Reconciliar al iniciar/reanudar, después de cambios relevantes de permisos y ajustes, y validar recuperación tras reinicio. Distinguir proceso cerrado de «Forzar detención» de Android.
- Mostrar permisos y fallos de programación de forma comprensible. Guardar una tarea seguirá siendo posible sin permisos.
- Evitar generar todos los avisos históricos antes de filtrarlos. Acotar lotes de programación, pero **no introducir una ventana que deje de recordar si el usuario no abre la app**: la reposición debe funcionar en nativo y probarse; si no se puede garantizar, revisar el diseño antes de usarla.
- Manejar el toque en una notificación para abrir la tarea; si fue eliminada, mostrar una salida válida.

La documentación del plugin diferencia permisos de notificación y de alarmas exactas, y describe restricciones durante Doze. Se probarán por separado; no se prometerá entrega exacta. [Documentación de notificaciones locales](https://capacitorjs.com/docs/apis/local-notifications).

**Aceptación:** crear/editar/completar/reabrir/eliminar desde app y widgets produce el conjunto esperado de pendientes, sin duplicados. DAILY conserva 2 horas y cambiar ajustes solo modifica la cadencia de DEADLINE. Los fallos quedan visibles y son reintentables.

### Fase 4 — Agenda diaria y calendario mensual

**Objetivo:** completar los requisitos funcionales pendientes. Esfuerzo alto.

- Crear `features/calendar` con consultas por intervalo, fecha seleccionada compartida y utilidades de solapamiento.
- Añadir vista «Hoy» con anterior/siguiente, volver a hoy y lista combinada por horario.
- Incorporar mes navegable, día seleccionado, puntos de colores persistidos y contadores separados.
- Definir y probar la regla de elementos que terminan exactamente a medianoche; usarla igual en listas, calendario y widgets.
- Evitar una consulta por celda: cargar el intervalo visible y derivar agrupaciones locales.
- Mantener tareas completables y eventos informativos. Añadir estados vacío/error/carga y navegación accesible.

**Aceptación:** elementos de varios días, cambios de mes/año y horario local aparecen en las fechas correctas; puntos y contadores coinciden con la lista. No es necesaria una librería pesada de calendario para este alcance.

### Fase 5 — Diseño y productividad

**Objetivo:** mejorar claridad y operación móvil. Esfuerzo medio.

- Conservar la paleta burdeos; mostrar fecha/plazo y estado vencida/en curso en tarjetas sin depender solo del color.
- Mostrar el término calculado de tareas de 24 horas y explicar que no se repiten.
- Separar filtros por estado y tipo; añadir búsqueda por título/descripción y orden por vencimiento.
- Mantener filtros al volver de editar; actualizar estados temporales al reanudar y en límites relevantes de tiempo.
- Ampliar zonas táctiles, añadir estado accesible a selectores y comprobar texto ampliado, teclado, títulos largos y ambos temas.
- Ofrecer Sistema/Claro/Oscuro con persistencia coherente; separar CSS por componentes después de verificar usos.

**Aceptación:** QA en ancho móvil, texto ampliado y temas claro/oscuro; acciones y formularios siguen accesibles con teclado y lector de pantalla. Se conservan los colores elegidos por el usuario.

### Fase 6 — Cierre técnico y QA

**Objetivo:** entregar una versión reproducible y comprobada. Esfuerzo medio.

- Ejecutar typecheck, lint, pruebas unitarias/integración, build web y compilación Gradle.
- Probar actualización sobre una instalación con datos, no solo instalación limpia.
- Revisar consola y logs nativos de los flujos principales; documentar limitaciones reales.
- Añadir README con entorno, scripts, preparación Capacitor/Android, respaldo y alcance web.
- Unificar la política de versiones del paquete y Android; documentar cómo incrementarlas.

**Salida:** informe de validación con resultados, APK de prueba si el entorno lo permite y propuesta de commit en español. No se declarará finalizado un arreglo nativo basándose únicamente en Vitest.

## 4. Dependencias: qué mantener, actualizar o cambiar

Versiones actuales obtenidas de `package-lock.json`, no inferidas de los rangos con `^`. Las versiones objetivo exactas deben fijarse durante la implementación tras comprobar publicación estable, `engines`, `peerDependencies` y cambios incompatibles. No se ejecutó una auditoría de vulnerabilidades en esta entrega; no se afirma que una versión sea vulnerable solo por ser antigua.

| Dependencia actual | Recomendación | Motivo y condición |
| --- | --- | --- |
| Vite 5.4.21 | Actualizar con prioridad a una línea soportada, preferentemente 8.x tras comprobar compatibilidad | La política oficial ya no incluye Vite 5. Migración aislada con pruebas de assets y WebView |
| `@vitejs/plugin-react` 4.7.0 | Actualizar junto con Vite | Elegir una versión cuyos peers admitan el Vite objetivo |
| Vitest 2.1.9 | Mantener Vitest y actualizar con Vite | La documentación vigente describe Vitest 5, que requiere Vite ≥6.4 y Node ≥22.12; verificar la versión estable publicada antes de fijarla |
| jsdom 25.0.1 / Testing Library 16.3.3 / jest-dom 6.9.1 | Mantener; ajustar versiones compatibles con el bloque de pruebas | Comprobar cambios de DOM/eventos, sin reemplazar pruebas por snapshots para hacerlas pasar |
| Capacitor core/android/cli 6.2.2 y notificaciones 6.1.3 | Migración coordinada propuesta hacia 8.x | Revisar guías 6→7→8 y del minor elegido; mantener compatibles plugins y código nativo personalizado |
| SQLite Capacitor 6.0.2 | Mantener el plugin y evaluar 8.x junto a Capacitor | El repositorio oficial dispone de releases 8.x; probar apertura del archivo existente y convivencia con el helper Android |
| React / React DOM 18.3.1 y sus tipos | Mantener en la primera corrección; evaluar 19.x en entrega posterior | Los defectos detectados no requieren cambiar React. Al migrar, actualizar tipos y revisar `JSX.Element`, refs y pruebas |
| React Router DOM 7.18.4 | Mantener la familia 7; revisar parches compatibles | No hay necesidad demostrada de sustituir el enrutador ni abandonar HashRouter en Capacitor |
| date-fns 4.4.0 | Mantener | El trabajo pendiente es centralizar reglas y normalización, no cambiar de biblioteca de fechas |
| TypeScript 5.9.3 | Mantener inicialmente | Evaluar actualización mayor después de herramientas, sin mezclarla con correcciones de negocio |

Vite publica su política de soporte y la guía de Vitest fija los mínimos indicados. Node 24.18.0 del entorno supera esos mínimos, aunque eso no prueba por sí solo la compatibilidad de todas las dependencias. [Soporte de Vite](https://vite.dev/releases), [migración de Vitest](https://vitest.dev/guide/migration/).

La guía base de Capacitor 8 pide Node 22+, Android Studio 2025.2.1+, minSdk 24, SDK 36 y actualizaciones de Gradle/AGP y Kotlin. El proyecto tiene minSdk 22 y SDK 34: elevar el mínimo excluye dispositivos antes admitidos. El minor final puede añadir otros requisitos; revisar su guía antes de fijarlo. Esta migración queda condicionada a aceptar el nuevo mínimo y verificar el entorno nativo. [Guía Capacitor 8](https://capacitorjs.com/docs/updating/8-0).

No recomiendo reemplazar SQLite por otra base ni el plugin por rumores de abandono: hay releases 8.x en su fuente oficial. La versión concreta debe verificarse en el registro, porque la rama principal y la página de releases pueden diferir. [Releases del plugin SQLite](https://github.com/capacitor-community/sqlite/releases). React 19 requiere su propia revisión de incompatibilidades; se trataría como migración opcional separada. [Guía de React 19](https://react.dev/blog/2024/04/25/react-19-upgrade-guide).

### Incorporaciones y ajustes propuestos

- **ESLint, `@eslint/js` y `typescript-eslint`:** añadir configuración plana y reglas de promesas; complementar con reglas de React Hooks y accesibilidad JSX compatibles. Es la incorporación prioritaria. [Configuración oficial de typescript-eslint](https://typescript-eslint.io/getting-started/).
- **`@capacitor/app`:** evaluar su incorporación en la misma familia mayor de Capacitor para coordinar reanudación nativa y evitar depender solo de focus/visibilitychange. Retirar listeners redundantes si se adopta. [API oficial App](https://capacitorjs.com/docs/apis/app).
- **Motor SQLite para pruebas:** elegir después de fijar Node y el adaptador; valorar `node:sqlite` si sus APIs en el entorno elegido cubren el contrato. Las pruebas Android seguirán siendo necesarias aunque el motor de Node pase.
- **`@testing-library/user-event`:** incorporación opcional para pruebas realistas de formularios, foco y teclado, seleccionando una versión compatible. No es requisito para corregir el dominio.
- **Mover `@capacitor/cli` a devDependencies:** herramienta de construcción, sin uso en ejecución. Conservarla disponible en el entorno que construye el APK.
- **No añadir ahora:** Redux, un ORM, una librería completa de calendario, otra plataforma móvil ni un backend. Aportarían coste sin resolver directamente los defectos actuales.

### Procedimiento de actualización

1. Inventariar versiones y consultar changelogs, peers y engines de cada bloque.
2. Revisar avisos con auditoría del gestor, separando dependencias de ejecución y herramientas; evaluar aplicabilidad. No usar corrección forzada automática.
3. Cambiar un bloque, actualizar el lockfile y pasar su validación antes del siguiente.
4. Revisar la salida de cualquier asistente de migración antes de usarlo: no ejecutar herramientas que invoquen Git ni permitir que sustituyan sin revisión los widgets o archivos Android personalizados.
5. No elegir `latest` de forma ciega. Registrar versiones exactas resueltas y cambios de requisitos.

## 5. Matriz mínima de validación

| Área | Casos imprescindibles |
| --- | --- |
| Datos | Crear/editar/eliminar; fallo de lectura/escritura; reintento; actualización con datos; migración interrumpida |
| Fechas | Medianoche; cambio de mes/año; evento de varios días; cambios horarios de Santiago; DAILY de 24 h |
| Recordatorios | Permiso denegado/concedido/revocado; editar plazo; cambiar intervalo; tarea completada; reintento sin duplicados |
| Widgets | Completar y reabrir con app visible, en segundo plano y proceso cerrado; comprobar cancelación/programación real |
| Android | Reinicio, ahorro de batería, comportamiento diferenciado tras forzar detención; SDK mínimo acordado y versión reciente |
| UI | Vacío frente a error; doble pulsación; confirmación; navegación de notificación; teclado; foco; tema y texto ampliado |
| Calendario | Lista, puntos y contadores coherentes; colores persistidos; rangos que cruzan días |

Como referencia, la revisión anterior registró build correcto y 35 pruebas aprobadas. En esta entrega documental no se repitieron: no hubo cambios ejecutables. Esa referencia no sustituye la validación de las futuras fases.

## 6. Fuera del primer alcance

Copia local exportable/importable, duplicación de tareas/eventos, archivo y estadísticas quedarían para entregas posteriores. El respaldo técnico previo a migraciones sí forma parte de este plan. Recurrencias y notificaciones de eventos requieren una petición y definición separadas.

## 7. Propuesta para aprobar

Recomiendo aprobar las fases 0–6 y el bloque de herramientas web; mantener React inicialmente; y condicionar la migración Capacitor/SQLite a la compatibilidad Android confirmada en fase 0. La persistencia web completa y las ampliaciones de la sección 6 quedan fuera.

La aprobación posterior del usuario autorizó las fases y la mejora visual final. Se implementó Android mínimo API 24 y se mantuvo la web como vista de desarrollo. Consultar `informeValidacion.md` para el cierre técnico y las comprobaciones pendientes.
