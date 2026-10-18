# Despliegue en Vercel y Neon

La aplicación se ejecuta en la nube sin necesidad de tener un servidor propio.

## Arquitectura

**Vercel** aloja tres proyectos independientes:
- **Backend**: Servidor API que procesa recetas, planes, lista de compra, despensa y cuenta. Se ejecuta como una función en Frankfurt.
- **Frontend**: Aplicación web que los usuarios ven. Redirige las peticiones `/api` al backend.
- **Backoffice**: Panel de administración para crear invitaciones y gestionar datos. No contiene contraseña en la URL; se pide al entrar.

**Neon** almacena la base de datos PostgreSQL. La aplicación usa una conexión agrupada y las migraciones usan una conexión directa.

## Neon

Almacena todos los datos: recetas, planes, lista de compra, despensa, cuentas de usuario y hogares.

Tiene dos tipos de conexión:
- **Agrupada** (con `-pooler`): Para la aplicación. Permite muchas conexiones simultáneas sin saturar la BD.
- **Directa** (sin `-pooler`): Para migraciones de esquema. Directa y sin límite de conexiones.

Si hay datos en desarrollo (Docker local), se pueden importar a Neon con el script `deploy/migrate-to-neon.ps1`.

## Vercel

Aloja la app web y el servidor. Detecta automáticamente que es un proyecto Node.js/Fastify y lo despliega.

Cada proyecto necesita variables de entorno:

**Backend:**
- `DATABASE_URL`: Conexión agrupada de Neon
- `DIRECT_URL`: Conexión directa de Neon
- `JWT_SECRET`: Secreto para firmar sesiones
- `ADMIN_CREDENTIALS_JSON`: Contraseña del panel admin
- `ALLOWED_ORIGINS`: URLs donde se puede acceder (frontend y backoffice)
- `APP_URL`: URL del frontend
- `PUBLIC_REGISTRATION`: Si permite registro público (normalmente `false`)

**Frontend:**
- `VITE_LEGAL_OPERATOR`: Nombre del responsable (para página de privacidad)
- `VITE_LEGAL_CONTACT`: Email de contacto (para privacidad)

**Backoffice:**
- `BACKEND_URL`: URL del backend en Vercel

## Consideraciones

- **Vercel Hobby** es gratuito pero tiene límites de uso. Si la aplicación crece mucho, se requiere un plan de pago.
- **Neon Free** puede ser lento si no se usa durante tiempo. El servicio hiberna para ahorrar recursos.
- **Backups**: Se deben hacer copias periódicas de Neon fuera de la plataforma como respaldo.
- **Seguridad del backoffice**: No se debe publicar su URL. Se protege con credenciales que se solicitan al entrar.
