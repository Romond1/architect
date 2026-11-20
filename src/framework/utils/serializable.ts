/** JSON data only: no renderers, DOM nodes, cycles, functions, or non-finite numbers. */
export function isSerializable(
  value: unknown,
  parents = new Set<object>()
): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || parents.has(value)) return false;
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    return false;
  parents.add(value);
  const valid = Array.isArray(value)
    ? Array.from(value).every((item) => isSerializable(item, parents))
    : Object.values(value).every((item) => isSerializable(item, parents));
  parents.delete(value);
  return valid;
}
export function cloneSerializable<T>(value: T): T {
  if (!isSerializable(value))
    throw new Error(
      'Project and workspace data must be JSON-serializable (plain data with finite numbers, without cycles).'
    );
  return JSON.parse(JSON.stringify(value)) as T;
}
