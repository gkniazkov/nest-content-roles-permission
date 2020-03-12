export function memoize(fn: Function) {
  const defaultKey = 'default';
  const cache = {};
  return (...args) => {
    const n = args[0];
    if (n in cache) {
      return cache[n];
    } else {
      const result = fn(n === defaultKey ? undefined : n);
      cache[n] = result;
      return result;
    }
  };
}
