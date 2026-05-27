# Planificador de Comidas

## Concepto

App de planificación de comidas semanal/mensual para hogares. Permite gestionar recetas, planificar menús y generar listas de la compra automáticamente.

## Funcionalidades principales

- **Multi-usuario con hogares compartidos** - Varios usuarios pueden pertenecer al mismo hogar
- **Recetas con ingredientes** - CRUD completo con ingredientes dinámicos
- **Categorías fijas** - Desayuno, Comida, Cena, Snack, Postre (una receta puede tener varias)
- **Tags flexibles** - Cada hogar define sus propios tags (Vegano, Rápido, etc.)
- **Favoritos por usuario** - Cada miembro marca sus recetas favoritas
- **Planificación semanal/mensual** - Calendario para asignar recetas a días y tipos de comida
- **Lista de la compra auto-generada** - A partir del plan de comidas, con items manuales

## Modelo de datos

- **User** - Usuarios del sistema
- **Household** - Hogares (agrupación de usuarios)
- **HouseholdMember** - Relación usuario-hogar con rol (OWNER/MEMBER)
- **Recipe** - Recetas con título, descripción, instrucciones, tiempos, raciones
- **RecipeIngredient** - Ingredientes de una receta (nombre, cantidad, unidad)
- **RecipeCategory** - Categorías de comida asignadas a una receta
- **Tag** - Tags flexibles por hogar
- **RecipeTag** - Relación receta-tag
- **UserFavorite** - Favoritos personales
- **MealPlanItem** - Elemento del plan de comidas (fecha + tipo + receta o texto libre)
- **ShoppingList** - Lista de la compra con rango de fechas
- **ShoppingListItem** - Elemento de la lista (con checkbox)

## Decisiones de diseño

1. Todo está scoped a un household
2. Categorías = enum fijo en join table, Tags = flexibles por hogar
3. MealPlanItem acepta recipeId O customMealName (para "Comer fuera", "Sobras")
4. Shopping list = snapshot (copia ingredientes al generar)
5. Favoritos son personales por usuario
6. Sin sync en tiempo real para MVP
