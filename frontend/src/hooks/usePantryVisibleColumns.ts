import { useEffect, useState } from 'react';

/** Columnas visibles según ancho del viewport (móvil = 1). */
function getVisiblePantryColumns(viewportWidth: number): number {
  if (viewportWidth >= 1280) return 5;
  if (viewportWidth >= 1024) return 4;
  if (viewportWidth >= 768) return 3;
  if (viewportWidth >= 640) return 2;
  return 1;
}

/** Móvil = una pila; escritorio = columnas del tablero. */
export function usePantryVisibleColumns(): number {
  const [visibleColumns, setVisibleColumns] = useState(() =>
    typeof window !== 'undefined' ? getVisiblePantryColumns(window.innerWidth) : 1,
  );

  useEffect(() => {
    const update = () => setVisibleColumns(getVisiblePantryColumns(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return visibleColumns;
}
