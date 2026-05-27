import { useList, useDelete } from '@refinedev/core';

interface Recipe {
  id: string;
  title: string;
  household?: { name: string };
  categories?: Array<{ mealType: string }>;
  _count?: { ingredients: number };
  createdAt: string;
}

export function RecipeList() {
  const { data, isLoading } = useList<Recipe>({ resource: 'recipes' });
  const { mutate: deleteRecipe } = useDelete();

  const recipes = data?.data ?? [];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recetas</h2>
      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titulo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hogar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categorias</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingredientes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recipes.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{r.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.household?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.categories?.map((c) => c.mealType).join(', ') || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r._count?.ingredients ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteRecipe({ resource: 'recipes', id: r.id })}
                      className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
