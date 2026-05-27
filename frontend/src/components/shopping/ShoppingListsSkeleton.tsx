export function ShoppingListsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando listas">
      <div className="section-overview-panel h-24 animate-pulse opacity-60">
        <span className="sr-only">Cargando</span>
      </div>
      <div className="shopping-list-card card h-32 animate-pulse opacity-60">
        <span className="sr-only">Cargando</span>
      </div>
      <div className="shopping-lists-layout">
        <div className="shopping-list-card card h-28 animate-pulse opacity-60">
          <span className="sr-only">Cargando</span>
        </div>
        <div className="shopping-list-card card h-28 animate-pulse opacity-60">
          <span className="sr-only">Cargando</span>
        </div>
      </div>
    </div>
  );
}
