# Funcionamiento sin conexión

La aplicación instala un service worker y guarda en caché la interfaz estática (HTML, CSS, JavaScript e iconos). Así puede abrir la pantalla base cuando la red falla.

Las peticiones `/api` usan siempre la red. No se almacenan respuestas privadas ni se permiten cambios de recetas, planes, despensa o cuenta sin conexión. Esta decisión evita mostrar datos obsoletos o mezclar información entre usuarios.

Por tanto, la versión actual es una PWA instalable con arranque sin conexión, no una aplicación de edición offline completa. Para ofrecer edición offline en el futuro habrá que diseñar una cola local cifrada, resolución de conflictos y separación estricta por usuario/hogar.
