/** URL profile=demo detection (kept separate to avoid circular imports). */
export function resolveDemoFromSearch(search: string | undefined | null): boolean {
  if (!search) return false;
  try {
    const q = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    return q.get('profile') === 'demo' || q.get('demo') === '1';
  } catch {
    return false;
  }
}
