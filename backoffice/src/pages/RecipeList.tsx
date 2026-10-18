import { useState } from 'react';
import { useList } from '@refinedev/core';
import { Link } from 'react-router-dom';
import { AdminTable } from '../components/AdminTable';
import { adminDelete } from '../lib/adminClient';

interface Recipe { id: string; title: string; household?: { name: string }; _count?: { ingredients: number }; createdAt: string }
const PAGE_SIZE = 10;
export function RecipeList() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [sort, setSort] = useState('createdAt');
  const { data, isLoading, refetch } = useList<Recipe>({ resource: 'recipes', pagination: { current: page, pageSize: PAGE_SIZE }, filters: search ? [{ field: 'q', operator: 'contains', value: search }] : [], sorters: [{ field: sort, order: sort === 'title' ? 'asc' : 'desc' }] });
  async function handleDelete(id: string) { await adminDelete('recipes', id); await refetch(); }
  return <AdminTable title="Recetas" description="Busca recetas por título o por hogar y revisa sus ingredientes."
    data={data?.data ?? []} total={data?.total ?? 0} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} sort={sort} onSortChange={(value) => { setSort(value); setPage(1); }} sortOptions={[{ label: 'Más recientes', value: 'createdAt' }, { label: 'Título', value: 'title' }]}
    isLoading={isLoading} onDelete={handleDelete} deleteMessage={(recipe) => `Vas a eliminar definitivamente la receta “${recipe.title}” y sus ingredientes, etiquetas y apariciones relacionadas. ¿Continuar?`} renderActions={(recipe) => <Link className="admin-button" to={`/recipes/${recipe.id}`}>Ver ficha</Link>} emptyMessage="No hay recetas que coincidan."
    columns={[{ label: 'Título', render: (recipe) => <Link className="admin-row-link" to={`/recipes/${recipe.id}`}>{recipe.title}</Link> }, { label: 'Hogar', render: (recipe) => recipe.household?.name ?? '—' }, { label: 'Ingredientes', render: (recipe) => recipe._count?.ingredients ?? 0 }, { label: 'Creada', render: (recipe) => new Date(recipe.createdAt).toLocaleDateString('es-ES') }]}
  />;
}
