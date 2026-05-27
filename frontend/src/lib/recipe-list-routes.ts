/** Rutas donde se conservan los filtros del listado (listado, detalle, edición, nueva). */
export function isRecipesSectionPath(pathname: string): boolean {
  return pathname === '/recipes' || pathname.startsWith('/recipes/');
}
