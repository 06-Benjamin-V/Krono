# Krono

Agenda personal local para Android. React 18, TypeScript, Capacitor 8 y SQLite; sin cuentas, servidor ni API externa.

## Desarrollo

Requisitos: Node 24, npm 11, Java 21 y Android SDK 36. Android mínimo: API 24 (Android 7). Gradle 8.14.3 y AGP 8.13 están fijados en el proyecto.

```powershell
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run android:sync
cd android
.\gradlew.bat assembleDebug testDebugUnitTest
.\gradlew.bat :app:connectedDebugAndroidTest
```

Configura `JAVA_HOME` y el SDK mediante `ANDROID_HOME` o `android/local.properties`. La instrumentación requiere un emulador de QA: la prueba de avisos solo se ejecuta si no hay tareas ni notificaciones almacenadas y concede el permiso de notificaciones a esa instalación. No utilizar un teléfono con datos personales para esta batería.

`UpgradeInstrumentedTest` se omite en la batería normal: se ejecuta explícitamente con `-e upgradeMode seed` sobre el APK anterior y luego con `-e upgradeMode verify` después de instalar el nuevo APK con `adb install -r`. Seleccionar esa clase con `-e class com.personaltaskmanager.app.UpgradeInstrumentedTest` al invocar el runner `com.personaltaskmanager.app.test/androidx.test.runner.AndroidJUnitRunner`. Requiere instalar previamente el APK de androidTest generado por `assembleDebugAndroidTest`. La fase seed exige una base vacía, crea datos sintéticos y un respaldo con `VACUUM INTO`; verify comprueba datos, respaldo y arranque de la WebView. No desinstalar entre ambas fases.

APK de depuración: `android/app/build/outputs/apk/debug/app-debug.apk`. Ejecutar `android:sync` después de cambiar la web y antes de compilar Android. El APK de depuración no es un artefacto de publicación firmado.

La web utiliza SQLite en memoria mediante sql.js: **recargar borra los datos de esa vista**. Android conserva los datos en SQLite. No se ofrece persistencia web como producto.

## Datos y reglas

- DAILY dura exactamente 24 horas y avisa cada 2 horas; no es una recurrencia.
- DEADLINE usa el intervalo guardado en Ajustes. Los eventos no se completan ni generan avisos.
- Las fechas se guardan en UTC y se muestran en hora local. Los rangos son inclusivos: un elemento que termina exactamente a medianoche también aparece en ese día.
- Los repositorios acceden a SQLite; los servicios coordinan avisos y widgets; los hooks gestionan estado, errores y acciones.
- `src/database/migrations/*.sql` es el esquema canónico, incluido como assets Android. Añadir archivos numerados para nuevas versiones; no editar una migración ya distribuida ni borrar tablas para actualizar.
- App y widgets usan el archivo real del plugin `taskmanagerSQLite.db`: Capacitor elimina el sufijo `.db` del nombre lógico antes de añadir `SQLite.db`. El helper anterior apuntaba por error a `taskmanager.dbSQLite.db`; ese archivo, si existe, queda intacto. Antes de distribuir una migración, obtener un respaldo consistente con la base cerrada o mediante backup SQLite; no copiar solo el archivo principal si WAL está activo. No desinstalar para comprobar actualizaciones.

## Recordatorios

`TaskReminderCoordinator` coordina app, receptor de widgets y reinicio, utilizando el planificador del plugin de notificaciones. Su adaptador depende de APIs internas de **8.3.1**, fijada explícitamente: una actualización exige repetir las pruebas nativas. Los IDs y los fallos se registran en preferencias locales. La reconciliación reconstruye los avisos futuros a partir de SQLite.

El límite global es 10.000 avisos por reconciliación; un plan excesivo produce un aviso visible para reducir plazo o aumentar intervalo. No existe una ventana móvil que dependa de abrir periódicamente la app. Android y algunos fabricantes pueden imponer límites inferiores o retrasar las alarmas por ahorro de batería. No se promete exactitud horaria; forzar detención requiere volver a abrir la app.

## Versiones y mantenimiento

Mantener `package.json.version` y `android/app/build.gradle.versionName` iguales; aumentar `versionCode` en cada distribución. Esta entrega usa 0.2.0 / 2. El esquema se versiona por separado.

El CLI de Capacitor está fijado en 8.4.3; core/android en 8.5.2 y SQLite en 8.1.1. Vite 8.3.2, Vitest 5.0.3 y ESLint 10 forman el bloque de herramientas actualizado. React 19 queda fuera de esta migración. Consultar `informeValidacion.md` para resultados y pendientes de QA.
