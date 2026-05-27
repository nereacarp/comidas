export const storageLocationData = [
  { name: 'Nevera', icon: 'fridge', color: '#9bf6ff', order: 0, layoutColumn: 0 },
  { name: 'Congelador', icon: 'snowflake', color: '#e6ccff', order: 0, layoutColumn: 1 },
  { name: 'Despensa', icon: 'cabinet', color: '#ffd8a8', order: 0, layoutColumn: 2 },
  { name: 'Armario', icon: 'shelf', color: '#a8e6cf', order: 0, layoutColumn: 3 },
] as const;

export const pantryItemData: Array<{
  name: string;
  quantity: number;
  unit: string;
  location: string;
}> = [
  { name: 'Leche entera', quantity: 1, unit: 'L', location: 'Nevera' },
  { name: 'Huevos', quantity: 12, unit: 'uds', location: 'Nevera' },
  { name: 'Queso manchego', quantity: 200, unit: 'g', location: 'Nevera' },
  { name: 'Yogur natural', quantity: 4, unit: 'uds', location: 'Nevera' },
  { name: 'Mantequilla', quantity: 250, unit: 'g', location: 'Nevera' },
  { name: 'Jamón cocido', quantity: 150, unit: 'g', location: 'Nevera' },
  { name: 'Tomates', quantity: 4, unit: 'uds', location: 'Nevera' },
  { name: 'Lechuga', quantity: 1, unit: 'ud', location: 'Nevera' },
  { name: 'Zanahorias', quantity: 500, unit: 'g', location: 'Nevera' },
  { name: 'Pimiento rojo', quantity: 2, unit: 'uds', location: 'Nevera' },
  { name: 'Cebolla', quantity: 3, unit: 'uds', location: 'Nevera' },
  { name: 'Limón', quantity: 2, unit: 'uds', location: 'Nevera' },
  { name: 'Pechugas de pollo', quantity: 500, unit: 'g', location: 'Congelador' },
  { name: 'Merluza', quantity: 400, unit: 'g', location: 'Congelador' },
  { name: 'Gambas peladas', quantity: 300, unit: 'g', location: 'Congelador' },
  { name: 'Guisantes', quantity: 400, unit: 'g', location: 'Congelador' },
  { name: 'Pan de molde', quantity: 1, unit: 'bolsa', location: 'Congelador' },
  { name: 'Arroz', quantity: 1, unit: 'kg', location: 'Despensa' },
  { name: 'Pasta macarrones', quantity: 500, unit: 'g', location: 'Despensa' },
  { name: 'Espaguetis', quantity: 500, unit: 'g', location: 'Despensa' },
  { name: 'Aceite de oliva', quantity: 750, unit: 'ml', location: 'Despensa' },
  { name: 'Tomate frito', quantity: 2, unit: 'botes', location: 'Despensa' },
  { name: 'Garbanzos cocidos', quantity: 2, unit: 'botes', location: 'Despensa' },
  { name: 'Lentejas', quantity: 500, unit: 'g', location: 'Despensa' },
  { name: 'Atún en lata', quantity: 4, unit: 'latas', location: 'Despensa' },
  { name: 'Harina', quantity: 1, unit: 'kg', location: 'Despensa' },
  { name: 'Azúcar', quantity: 500, unit: 'g', location: 'Despensa' },
  { name: 'Sal', quantity: 1, unit: 'kg', location: 'Despensa' },
  { name: 'Avena', quantity: 500, unit: 'g', location: 'Despensa' },
  { name: 'Café molido', quantity: 250, unit: 'g', location: 'Armario' },
  { name: 'Miel', quantity: 350, unit: 'g', location: 'Armario' },
  { name: 'Chocolate negro', quantity: 200, unit: 'g', location: 'Armario' },
];
