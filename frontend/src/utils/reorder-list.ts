/** Move one item from `from` to `to` (`to` may equal `list.length` to append). */
export function reorderInList<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to > list.length) {
    return [...list];
  }
  if (from === to) {
    return [...list];
  }

  const next = [...list];
  const [removed] = next.splice(from, 1);
  const insertAt = Math.min(to, next.length);
  next.splice(insertAt, 0, removed);
  return next;
}
