# Informe previo de revisión — Krono

Fecha: 3 de octubre de 2026.

## 1. Alcance y resultado

Revisión del código React/TypeScript, persistencia, notificaciones, estilos, pruebas y código Android. Se ejecutaron compilación y pruebas automatizadas. No se ejecutó ningún comando Git ni se inspeccionó su historial.

La aplicación tiene una base útil: creación y edición de tareas y eventos, filtros, tarjetas expandibles, colores personalizados, temas claro/oscuro, consultas parametrizadas y un servicio central de notificaciones. Las tareas de 24 horas mantienen esa duración y los eventos no incorporan estados de completado ni recordatorios.

Antes de ampliar el producto, conviene asegurar la coherencia de las notificaciones, mostrar errores de persistencia y completar la agenda y el calendario dentro de la aplicación. Los widgets Android existentes no sustituyen estos componentes exigidos en las instrucciones del proyecto.

Esta revisión no incluye prueba visual en navegador, instalación en teléfono, ejecución de Gradle ni comprobación real de entrega de notificaciones. Las observaciones de diseño provienen de componentes y CSS; los riesgos nativos requieren validación en dispositivo. No se implementaron las mejoras propuestas.

## 2. Hallazgos priorizados

Prioridades: **P1** afecta requisitos, datos o fiabilidad; **P2** mejora usabilidad y mantenimiento; **P3** amplía el producto. Esfuerzo relativo: bajo, medio o alto, sin equivalencia a una fecha de entrega.

### P1 — Completar tareas desde el widget no sincroniza recordatorios

**Evidencia:** `android/app/src/main/java/com/personaltaskmanager/app/widget/WidgetBroadcastReceiver.kt`, función `handleToggleComplete`, escribe el estado directamente mediante el ContentProvider o SQLite y actualiza los widgets. No cancela ni reprograma alarmas. `src/hooks/useAppInit.ts` inicializa el servicio, pero no reconcilia recordatorios con las tareas almacenadas.

**Impacto:** completar una tarea desde el widget puede dejar avisos pendientes; volverla a pendiente no reconstruye los avisos cancelados previamente desde la app.

**Propuesta:** una ruta común de sincronización nativa, operativa con la app cerrada, y reconciliación al reanudar la aplicación. Evitar duplicados y persistir operaciones fallidas para reintentar.

**Aceptación:** crear, completar y reabrir una tarea desde ambas interfaces; comprobar las notificaciones pendientes con la app abierta y cerrada. Esfuerzo alto.

### P1 — Fallos de notificaciones invisibles

**Evidencia:** `TaskRepository.ts` y `SettingsRepository.ts` capturan fallos de programación/cancelación sin comunicarlos. `NotificationService.initialize` solicita permisos pero no utiliza el resultado. `SettingsPage.tsx` puede mostrar «Intervalo actualizado» aunque la reprogramación haya fallado.

**Propuesta:** distinguir «tarea guardada» de «recordatorios programados», mostrar estado de permisos y permitir reintentar. Solicitar permiso con contexto para el usuario. Informar de que las restricciones de batería pueden retrasar la entrega, sin prometer exactitud.

**Aceptación:** denegar permisos o simular un fallo nativo no debe impedir guardar, pero sí debe mostrar que faltan recordatorios. Esfuerzo medio.

### P1 — Errores de listas y acciones sin tratamiento completo

**Evidencia:** `useTasks.ts` y `useEvents.ts` exponen `error`, pero sus páginas de listas no lo consumen. Los callbacks de completar/eliminar descartan promesas mediante `void`, sin captura local de fallos. Ajustes ignora los errores al cargar y permite guardar el valor inicial.

**Impacto:** un error de lectura puede parecer una lista vacía; un fallo de escritura puede producir una promesa rechazada sin explicación. Un error de carga en ajustes puede acabar reemplazando el valor anterior por el predeterminado.

**Propuesta:** estados de error con reintento, mensajes de acción fallida y bloqueo de acciones repetidas mientras se guarda. No habilitar el guardado de ajustes después de una carga fallida sin recuperación explícita. Esfuerzo medio.

### P1 — Faltan agenda diaria y calendario dentro de la app

**Evidencia:** `src/routes.tsx` solo registra tareas, eventos y ajustes; no existen componentes de calendario en `src/features`. Hay CSS de calendario y widgets nativos, pero no una pantalla React conectada a esos estilos.

**Propuesta:** pantalla «Hoy» con fecha seleccionada, anterior/siguiente y botón «Hoy»; mezclar tareas y eventos por horario. Añadir calendario mensual con puntos de los colores persistidos y contadores de tareas/eventos del día. Reutilizar consultas por solapamiento disponibles en los repositorios.

**Aceptación:** navegar entre días y meses, mostrar elementos que atraviesan medianoche, distinguir tareas completadas y mantener eventos sin casilla de completado. Esfuerzo alto.

### P1 en uso web — Datos volátiles

**Evidencia:** `src/database/sqlite.ts` utiliza `MemoryExecutor` fuera de la plataforma nativa. Las tareas, eventos e intervalo de recordatorios se pierden al recargar; el tema sí tiene una copia en localStorage.

**Propuesta:** si la web es únicamente una demo, identificar claramente su almacenamiento temporal. Si se pretende uso real en navegador, implementar persistencia SQLite compatible con web y probar recarga/cierre. Mantener el simulador de memoria únicamente para pruebas.

**Aceptación:** definir explícitamente el alcance web; no presentar una sesión temporal como almacenamiento permanente. Esfuerzo bajo para identificar la demo, alto para persistencia real.

### P2 — Borrado inmediato sin recuperación

**Evidencia:** las tarjetas llaman directamente a `onRemove` y los repositorios ejecutan `DELETE`. No hay confirmación ni deshacer en ese flujo.

**Propuesta:** confirmación identificando el elemento o una eliminación recuperable con «Deshacer». En tareas, coordinar también cancelación y restauración de recordatorios. Esfuerzo medio.

### P2 — Persistencia y migraciones con dos implementaciones

**Evidencia:** el esquema aparece en `src/database/migrations.ts` y en `TaskManagerDatabaseHelper.kt`; la versión se repite en varias ubicaciones. El `onUpgrade` nativo no implementa migraciones futuras. Las migraciones JavaScript se ejecutan sentencia por sentencia sin una transacción que agrupe toda la migración. Una inicialización rechazada queda almacenada en `initPromise`.

**Riesgo:** futuras actualizaciones pueden divergir según qué capa abra primero la base. Un fallo de inicialización no tiene una ruta limpia de reintento en la sesión actual. No se afirma que exista pérdida de datos en la versión actual.

**Propuesta:** un responsable explícito de migraciones, versiones coherentes, transacciones y pruebas de actualización conservando datos; restablecer el estado de inicialización tras fallos recuperables. Esfuerzo alto.

### P2 — Límites y validación de recordatorios

**Evidencia:** `computeReminderTimes` genera toda la serie antes de filtrar recordatorios pasados. No establece horizonte ni máximo. `setIntervalHours` comprueba que el valor sea positivo, pero acepta infinito; `save` no valida. Los IDs son hashes, sin mecanismo para detectar colisiones entre tareas.

**Propuesta:** validar valores finitos y límites de dominio, calcular desde el siguiente aviso futuro y programar por una ventana acotada. Persistir una correspondencia de IDs o detectar colisiones. Son riesgos de robustez, no colisiones observadas. Esfuerzo medio.

### P2 — Reglas y efectos mezclados con presentación/persistencia

**Evidencia:** `TaskForm.tsx` y `EventForm.tsx` importan repositorios y realizan conversión/validación de fechas. Los repositorios de tareas programan notificaciones y actualizan widgets; el servicio de notificaciones vuelve a importar el repositorio.

**Propuesta:** introducir servicios de aplicación para crear, editar, completar y eliminar. Los componentes manejan interacción, los hooks coordinan estados, los servicios aplican reglas y efectos, y los repositorios acceden a SQLite. Esto también elimina dependencias circulares y facilita simular fallos. Esfuerzo medio/alto.

### P2 — Fechas y configuración parcialmente centralizadas

**Evidencia:** `computeDailyEndAt` fija 24 directamente pese a existir `dailyTaskDurationHours`; ajustes repite el valor 4. Las conversiones para `datetime-local` aparecen en formularios. `formatDayHeader` ignora el parámetro de idioma y no establece español.

**Propuesta:** una fuente de valores predeterminados y utilidades comunes para edición/visualización de fechas. Normalizar las entradas a UTC antes de persistir para que las comparaciones SQL de texto sean consistentes. Probar límites de día y cambios de horario de America/Santiago manteniendo DAILY en 24 horas reales. Esfuerzo medio.

## 3. Mejoras de diseño y experiencia

Conservar la identidad burdeos, las variables de tema, las tarjetas expandibles y el soporte ya presente para movimiento reducido. La mejora principal debe ser la jerarquía de información y la facilidad de operar en móvil.

| Área | Observación | Mejora propuesta |
| --- | --- | --- |
| Inicio | La entrada lleva a todas las tareas | «Hoy» como resumen: pendientes del día, vencidas y próximos eventos; acceso a creación |
| Navegación | No hay acceso al calendario interno | Incorporar agenda/calendario y conservar accesos claros a tareas, eventos y ajustes |
| Tarjetas | El resumen muestra horas; una tarea de 24 h puede aparecer como «10:00 → 10:00» | Mostrar fecha de término, «mañana» o duración; incluir estado vencida/en curso además del tipo |
| Jerarquía | Metadatos administrativos ocupan muchos renglones al expandir | Priorizar descripción, plazo y estado; mover creación/actualización a detalle secundario |
| Acciones | Edición y eliminación permanecen visibles junto al contenido | Priorizar completar; colocar eliminar en menú secundario o protegerlo con confirmación/deshacer |
| Formularios | El tipo de 24 h no muestra su término calculado | Mostrar «Termina el…» y «No se repite»; explicar la cadencia de 2 horas |
| Filtros | Tipo y estado comparten una única selección | Separarlos para combinar «pendientes» con «24 horas»; añadir búsqueda y vencidas |
| Ajustes | Incluye el término técnico DEADLINE | Usar «tareas con plazo» y mostrar un ejemplo del próximo recordatorio |
| Eventos | Próximos incluye también eventos ya iniciados | Diferenciar «En curso», «Próximos» y «Pasados» cuando aporte claridad |
| Tema | Se toma la preferencia del sistema al inicio sin una opción persistente de seguimiento | Ofrecer «Sistema / Claro / Oscuro» y definir SQLite como fuente de verdad, con caché inicial si hace falta |

### Accesibilidad a revisar

- `Modal.tsx` admite Escape y semántica de diálogo, pero no gestiona foco inicial, atrapamiento ni devolución del foco. Incorporarlos antes de reutilizarlo para confirmaciones.
- Añadir `aria-pressed` a filtros y selectores de tipo; exponer el estado de completado con semántica de checkbox o botón con estado.
- Asociar errores a campos mediante `aria-describedby` y anunciarlos con un área de estado/alerta.
- Ampliar las zonas táctiles de controles pequeños: el indicador de completar tiene 26 × 26 px en CSS. Usar una zona interactiva de al menos 44–48 px sin necesidad de agrandar el icono.
- Comprobar contraste con colores personalizados, títulos extensos, texto ampliado, teclado virtual y ambos temas en teléfono. No hay una medición visual de contraste realizada en esta revisión.

## 4. Funcionalidades sugeridas

| Prioridad | Funcionalidad | Beneficio y alcance |
| --- | --- | --- |
| P1 | Agenda diaria y calendario mensual | Completar los requisitos actuales; sin depender de widgets del launcher |
| P2 | Búsqueda y orden por vencimiento | Encontrar tareas/eventos y atender primero lo urgente; conservar filtros al volver de editar |
| P2 | Exportar e importar una copia local | Recuperar datos o cambiar de teléfono sin backend; formato versionado, validación y estrategia de duplicados |
| P2 | Diagnóstico de recordatorios | Mostrar permisos, próxima programación y fallos recuperables; abrir la tarea al tocar un aviso |
| P2 | Duplicar tarea/evento | Reutilizar estructura con nueva fecha e identificador; no convertir DAILY en recurrencia |
| P3 | Archivo de completadas y datos históricos | Reducir ruido y acelerar consultas sin borrar información |
| P3 | Estadísticas sencillas | Conteo semanal de completadas y pendientes, calculado localmente |

Las recurrencias serían una ampliación separada del modelo y requieren definición explícita. No se propone añadir completado a eventos, notificaciones de eventos, autenticación ni servicios remotos.

## 5. Calidad, rendimiento y mantenimiento

- **Pruebas con SQLite real:** `MemoryExecutor` interpreta un subconjunto de SQL y devuelve resultados vacíos o ignora operaciones no reconocidas. Las pruebas actuales no verifican restricciones, transacciones ni comportamiento real del motor. Por ejemplo, el helper de ajustes intenta un `DELETE FROM app_settings` sin WHERE que el simulador no implementa.
- **Cobertura de flujos:** ampliar pruebas para edición, errores de guardado, ajustes, repositorio de eventos, cancelación nativa y reprogramación. Las tres pruebas del servicio de notificaciones verifican el plan de recordatorios, no llamadas nativas reales.
- **Lint:** no hay script ni configuración de lint en el proyecto revisado. Añadirlo junto a reglas de hooks, promesas y accesibilidad.
- **Escalabilidad:** las listas cargan todos los registros y filtran en memoria. Usar consultas acotadas por fecha/estado y paginación antes de introducir virtualización. Evitar recargas duplicadas por focus y visibilitychange.
- **CSS:** `global.css` supera las mil líneas e incluye estilos de calendario sin pantalla conectada. Dividir por componentes/features y retirar reglas obsoletas solo después de comprobar usos.
- **Compilación:** Vite informa importaciones estáticas y dinámicas del mismo módulo; no consiguen separación en chunks. Simplificar imports o definir carga diferida por rutas cuando sea útil.
- **Documentación:** añadir README con arranque, pruebas, persistencia temporal web, preparación de Capacitor, requisitos de Android y compilación mediante Gradle. Alinear la versión de paquete (0.1.0) con la política de versionado Android (actualmente 1.0).

## 6. Validación realizada y pendiente

| Verificación | Resultado |
| --- | --- |
| TypeScript | Correcto: `tsc --noEmit` dentro de `npm run build` |
| Build web | Correcto: Vite generó `dist`; avisos de imports mixtos, sin error de compilación |
| Vitest | 35 pruebas aprobadas en 6 archivos |
| Lint | No configurado; no se considera aprobado |
| Revisión estática | Código de UI, estilos, repositorios, notificaciones e integración nativa |
| QA visual / consola interactiva | Pendiente: no se abrió la app en esta revisión |
| Android / APK | Pendiente: no se ejecutó Gradle ni se instaló el APK existente |

El primer intento de build y pruebas falló por permisos `EPERM` al resolver rutas dentro del aislamiento. Al ejecutar fuera de ese aislamiento ambos finalizaron correctamente; no se modificó código para sortearlo. La compilación regeneró los artefactos de `dist`.

Antes de dar por corregidos los hallazgos nativos, probar una instalación nueva y una actualización con datos; reinicio del dispositivo; permisos concedidos y denegados; completar desde widget con la app cerrada; cambios de intervalo; y cambios de zona horaria. El éxito de las pruebas JavaScript no sustituye esa QA.

## 7. Limpieza realizada

Se retiraron la configuración raíz de la herramienta de asistencia anterior, su directorio local completo —incluidas dependencias y perfiles de agentes—, el documento de asignación de modelos y la entrada de exclusión correspondiente. Se reemplazó el nombre del orquestador anterior por una instrucción neutral en `AGENTS.md` y se dejó explícita la prohibición de ejecutar cualquier comando Git.

La búsqueda posterior no encontró las referencias anteriores en el código y archivos de texto del proyecto examinados, incluidos archivos ocultos y no ignorados por defecto. Se excluyeron metadatos de control de versiones, dependencias generales, cachés/builds Android y binarios. No se alteraron historiales, instalaciones globales ni conversaciones externas. Por tanto, la limpieza se refiere al espacio de trabajo revisado, no a una eliminación de rastros histórica o del sistema completo.

## 8. Orden recomendado

1. **Fiabilidad:** corregir recordatorios de widgets, permisos, errores de carga/acciones y recuperación de inicialización.
2. **Requisitos pendientes:** construir agenda y calendario internos con pruebas de fechas y colores.
3. **Usabilidad:** proteger borrados, mejorar tarjetas/formularios, búsqueda, filtros y accesibilidad.
4. **Mantenimiento:** servicios de aplicación, migraciones coordinadas, pruebas SQLite, lint y README.
5. **Ampliaciones:** copia local, duplicación y archivo; estadísticas después de estabilizar el uso diario.

Cada etapa debe pasar TypeScript, lint cuando exista, pruebas relevantes y QA del flujo afectado. Esta entrega documenta el diagnóstico y realiza la limpieza; no da por resueltos los defectos detectados.
