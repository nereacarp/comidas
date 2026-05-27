import { useList, useDelete } from '@refinedev/core';

interface Tag {
  id: string;
  name: string;
  color?: string;
  household?: { name: string };
  _count?: { recipes: number };
}

export function TagList() {
  const { data, isLoading } = useList<Tag>({ resource: 'tags' });
  const { mutate: deleteTag } = useDelete();

  const tags = data?.data ?? [];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tags</h2>
      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hogar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recetas</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{tag.name}</td>
                  <td className="px-4 py-3 text-sm">
                    {tag.color ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.color}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tag.household?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tag._count?.recipes ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteTag({ resource: 'tags', id: tag.id })}
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
