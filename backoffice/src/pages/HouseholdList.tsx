import { useList, useDelete } from '@refinedev/core';

interface Household {
  id: string;
  name: string;
  createdAt: string;
  _count?: { members: number; recipes: number };
}

export function HouseholdList() {
  const { data, isLoading } = useList<Household>({ resource: 'households' });
  const { mutate: deleteHousehold } = useDelete();

  const households = data?.data ?? [];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Hogares</h2>
      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miembros</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recetas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {households.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{h.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{h._count?.members ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{h._count?.recipes ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(h.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteHousehold({ resource: 'households', id: h.id })}
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
