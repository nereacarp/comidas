import { useState } from 'react';
import { HeartIcon, HeartOutlineIcon } from './ui/Icons';
import { createFavoritesApi } from '../api/favorites';
import { apiClient } from '../api/client';

const favoritesApi = createFavoritesApi(apiClient);

interface FavoriteButtonProps {
  recipeId: string;
  initialFavorited?: boolean;
  compact?: boolean;
}

export function FavoriteButton({
  recipeId,
  initialFavorited = false,
  compact = false,
}: Readonly<FavoriteButtonProps>) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await favoritesApi.toggle(recipeId);
      setIsFavorited(result.favorited);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`rounded-full cursor-pointer transition-colors flex items-center justify-center ${
        compact ? 'p-1.5 min-h-9 min-w-9' : 'p-2 min-h-11 min-w-11'
      } ${
        isFavorited
          ? 'text-[var(--danger-text)]'
          : 'text-muted hover:text-ink hover:bg-page'
      }`}
      style={isFavorited ? { background: 'var(--pastel-coral)' } : undefined}
      aria-label={isFavorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      {isFavorited ? <HeartIcon /> : <HeartOutlineIcon />}
    </button>
  );
}
