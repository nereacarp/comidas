# Funcionamiento sin conexión (PWA)

## Cómo funciona Comidas sin conexión

La app descarga y guarda en caché la interfaz (pantallas, estilos, iconos). Si se pierde la conexión, se puede abrir la app y ver la interfaz, pero sin datos.

## Qué funciona sin conexión

- Ver la estructura y botones de la app
- Instalar la app desde el navegador

## Qué NO funciona sin conexión

- Ver recetas, planes, lista de compra o despensa
- Crear, editar o eliminar datos
- Cambiar ajustes de cuenta

Esta decisión es deliberada: es mejor mostrar nada que mostrar información desactualizada.

## Futuro

Si en el futuro se quiere editar sin conexión, habría que implementar:
- Almacenamiento cifrado local
- Cola de cambios que se sincronice al recuperar conexión
- Resolución automática de conflictos si dos usuarios editan lo mismo
