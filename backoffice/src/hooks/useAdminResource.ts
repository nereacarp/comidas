import { useCallback, useEffect, useState } from 'react';
import { adminGet } from '../lib/adminClient';

export function useAdminResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true); setError('');
    try { setData(await adminGet<T>(path)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los datos.'); }
    finally { setLoading(false); }
  }, [path]);

  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}
