# Validación de la implementación — Krono 0.2.0

Fecha: 3 de octubre de 2026.

## Cambios implementados

Se implementaron errores recuperables, bloqueo de acciones repetidas, confirmación de borrado y control de foco. Se separaron servicios y repositorios, se normalizaron fechas y se reemplazó el simulador de SQL por SQLite real en memoria para web y pruebas. El esquema SQL ahora es compartido con Android.

App y widgets usan el coordinador nativo de recordatorios. Incluye cancelación al completar, reconstrucción al reabrir, IDs persistentes, recuperación al reiniciar y mensajes de sincronización pendiente. Los eventos no generan avisos.

La prueba del APK anterior detectó que el helper de widgets apuntaba a un archivo distinto del utilizado realmente por Capacitor. Se corrigió a `taskmanagerSQLite.db`, conservando la base de la app y dejando intacto el archivo antiguo del helper si existe. También se corrigió la inicialización del adaptador: devolver un proxy de plugin desde una función async provocaba una invocación nativa inexistente de `then()`. El registro de WidgetBridge ahora es único.

Se añadieron agenda diaria, calendario mensual con colores y contadores, búsqueda, filtros, orden y apariencia Sistema/Claro/Oscuro. La mejora visual conserva el burdeos, refuerza la jerarquía y adapta la navegación a cinco secciones en móvil. Los estilos nuevos están separados en `src/styles/workspace.css`.

Se actualizaron Capacitor, SQLite, Vite y Vitest, y se incorporó ESLint. Se conservó React 18. Android mínimo pasa a API 24. La búsqueda en código y configuración no encontró referencias a la herramienta de asistencia retirada; los informes históricos conservan el contexto de la revisión.

## Evidencia obtenida

| Comprobación | Resultado |
| --- | --- |
| TypeScript y ESLint | Correctos |
| Auditoría npm (`--omit=optional`) | 0 vulnerabilidades reportadas en esta ejecución |
| Vitest | 47 pruebas en 10 archivos, todas correctas |
| Build web y sincronización Capacitor | Correctos |
| Gradle assembleDebug | Correcto; APK generado con la interfaz actualizada |
| Pruebas JVM | 5 correctas, incluidas 4 del planificador |
| Instrumentación en emulador Android 17 | 3 pruebas generales correctas; la prueba de actualización se ejecuta aparte, en dos instalaciones |
| SQLite Android | Creación desde SQL canónico y conservación de estado, color y ajustes al reabrir |
| Actualización real de APK | APK anterior versionCode 1 → versionCode 2 con instalación `-r`, sin desinstalar entre versiones; tarea, color, completado y ajuste conservados |
| Respaldo de QA | `VACUUM INTO` consistente y apertura del respaldo para verificar la tarea; sin copiar archivos WAL por separado |
| Arranque nativo actualizado | La WebView alcanza la agenda después de abrir SQLite; comprobado por instrumentación |
| Recordatorios Android | 11 avisos DAILY, reconciliación sin duplicados y mismos IDs; completar desde el receptor del widget cancela; reabrir reconstruye sin React |
| Navegador móvil 360 × 800 | Crear, completar, calendario y ambos temas comprobados; sin errores ni advertencias de consola en los flujos observados |
| Accesibilidad automatizada | Diálogo con foco, Escape y retorno de foco; controles con etiquetas y estados |

Vitest y Gradle necesitaron acceso fuera del aislamiento para sus temporales y cachés. Los fallos de permisos iniciales no se contabilizan como pruebas aprobadas. La ejecución final sí pasó.

## Límites y QA pendiente antes de distribuir

El código de las fases está implementado, pero **la matriz completa de aceptación no está cerrada**. La actualización y el respaldo se comprobaron con datos sintéticos en un emulador temporal; no se obtuvo ni modificó una base personal del usuario. Quedan por validar entrega efectiva durante Doze y tras reinicio físico, permisos revocados, Android API 24 y un dispositivo real. La prueba del widget invoca su receptor; no verifica la interacción visual con un launcher real. Falta revisión con lector de pantalla y texto ampliado.

No se promete entrega exacta de avisos. Los planes demasiado grandes generan una advertencia y Android puede imponer límites propios. La web sigue siendo una vista temporal y lo indica. El APK es de depuración. Gradle conserva advertencias de APIs obsoletas y repositorios flatDir heredados del ecosistema Capacitor.

## Entrega

Código, pruebas, README y APK de depuración disponibles localmente. No se ejecutaron commit ni push en esta continuación: las instrucciones AGENTS.md adjuntadas por el usuario los reservan al humano.

Propuesta única de Conventional Commit:

`feat: reforzar persistencia y recordatorios e incorporar agenda y diseño renovado`
