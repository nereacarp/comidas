import { Link, useParams } from 'react-router-dom';
import { useAdminResource } from '../hooks/useAdminResource';

interface RecipeDetail { id: string; title: string; household: { id: string; name: string }; ingredients: Array<{ id: string; name: string; quantity: number | null; unit: string | null }>; categories: Array<{ mealType: string }>; tags: Array<{ tag: { id: string; name: string; color?: string } }> }
export function RecipeDetailPage() {
  const { id } = useParams(); const { data: recipe, loading, error } = useAdminResource<RecipeDetail>(id ? `/recipes/${id}` : null);
  if (loading) return <div className="admin-empty">Cargando receta…</div>;
  if (error || !recipe) return <div className="admin-alert admin-alert--error" role="alert">{error || 'Receta no encontrada.'}</div>;
  return <section><Link to="/recipes" className="admin-back">← Volver a recetas</Link><div className="admin-detail-header"><div><h1>{recipe.title}</h1><p>Hogar: <Link to={`/households/${recipe.household.id}`}>{recipe.household.name}</Link></p></div></div><div className="admin-detail-grid"><article className="admin-panel"><h2>Ingredientes ({recipe.ingredients.length})</h2><ul className="admin-list">{recipe.ingredients.map((ingredient) => <li key={ingredient.id}><span>{ingredient.name}</span><span>{ingredient.quantity ?? ''} {ingredient.unit ?? ''}</span></li>)}</ul></article><article className="admin-panel"><h2>Clasificación</h2><p><strong>Categorías:</strong> {recipe.categories.map((category) => category.mealType).join(', ') || 'Sin categorías'}</p><p><strong>Tags:</strong> {recipe.tags.map(({ tag }) => tag.name).join(', ') || 'Sin tags'}</p></article></div></section>;
}
