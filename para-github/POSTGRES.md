# Guardado del piloto privado · 0.4.0

La web puede usar PostgreSQL para sus cuentas y su progreso. Render puede reiniciar el servidor sin borrar la base externa. La configuración local de revisión sigue usando SQLite. El modo PILOT_FREE exige PostgreSQL. La práctica funciona desde que se prepara el servidor. Para conectar la voz consulta PILOTO.md.

## Preparar la base

Usar un proyecto Supabase Free dedicado. Elegir el Session pooler para una conexión IPv4 persistente. Guardar DATABASE_URL en los secretos del servidor. El servidor exige TLS y verifica el certificado en conexiones remotas. Proporcionar PG_CA_PEM si se necesita la CA del proyecto. Usar la URL de conexión sin parámetros de SSL.

Con una conexión privada de propietario, ejecutar una vez:

    npm ci
    npm run db:init

Alternativa sin consola: pegar una vez `scripts/supabase-setup.sql` en el editor SQL de Supabase. Crea el esquema y el rol `english47_app`, y muestra una sola vez su contraseña y el `ADMIN_INVITE_CODE`.

El instalador es transaccional y repetible. Crea el esquema privado english47, sus tablas y la versión 1 de migración PostgreSQL. Mantener ese esquema fuera de los esquemas expuestos por la API de Supabase. Para la ejecución habitual usar un rol dedicado con CONNECT a la base, USAGE en english47, SELECT en schema_versions, SELECT/INSERT/UPDATE/DELETE en las tablas de aplicación y USAGE en sus secuencias. Reservar propiedad y DDL para migraciones. El portal necesita únicamente la conexión del rol de ejecución.

Si ya existe progreso SQLite, detener escrituras en el origen y hacer una copia con la versión anterior. Importar la copia de esquema SQLite v3 con el rol de migración, antes de iniciar la web:

    npm run db:import -- /ruta/privada/copia.db

La importación abre el origen en lectura, verifica claves foráneas y columnas, copia todas las tablas en una transacción y ajusta los ID siguientes. Un destino con datos impide la operación. Conservar la copia original y comparar totales antes de retirar el servidor anterior. Si el archivo es anterior a v3, actualizar primero una copia mediante el flujo SQLite existente.

## Arranque del piloto

Configurar PILOT_FREE=true, DATABASE_URL, COOKIE_SECURE=true, PUBLIC_ORIGIN y un ADMIN_INVITE_CODE aleatorio de entre 32 y 128 caracteres de letras, números, guion o guion bajo. El administrador puede generar ese secreto en su gestor de contraseñas. Usar Node 22.13 o superior y npm start. La primera invitación se abre en la URL de la web seguida de /#/invite/ y el valor del secreto. Canjear en privado y retirar ADMIN_INVITE_CODE del entorno una vez creada la cuenta. En PostgreSQL las invitaciones de administrador no se imprimen en los logs. A partir de entonces invitar a cada alumno desde Administración.

Si faltan las credenciales o las migraciones en el modo de piloto, el servidor detiene el arranque. Las respuestas a operaciones sobre el progreso se envían después de confirmar la transacción. Las solicitudes del mismo usuario se ordenan mediante un bloqueo de PostgreSQL. Un turno de voz o una red lenta pueden demorar otras acciones de esa misma cuenta.

Para copias PostgreSQL, usar pg_dump con --format=custom y --schema=english47 con credenciales de respaldo por variables de entorno o un archivo privado de conexión. Restaurar con pg_restore en un destino vacío y comprobar inicio de sesión y totales. Mantener copias y credenciales fuera del archivo distribuido.

## Comprobar

    npm test

Para ejecutar la prueba adicional usar una base PostgreSQL desechable, completamente vacía y exclusiva de pruebas. Configurar ENGLISH47_TEST_DATABASE_URL y ejecutar:

    node test/postgres.integration.js

Crea datos ficticios, migra desde SQLite, prueba el acceso por HTTP, completa la jornada breve, repite respuestas, practica una mesa y vuelve a abrir el servidor y el pool. Una base que ya contiene el esquema english47 se rechaza antes de hacer escrituras.

En esta preparación se usó el motor PostgreSQL de PGlite por TCP con el driver pg. La conexión remota Supabase, sus permisos, certificados, cuotas y rendimiento concurrente aún requieren comprobación. La prueba no activa servicios externos ni comprueba el micrófono de un teléfono.
