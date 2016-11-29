export function merge(...objects: any[]): any { // .length of function is 2
  const result: any = {};
  for (const nextSource of objects) {
    if (nextSource !== undefined) {
      const keys: string[] = Object.keys(nextSource);
      for (let i = 0; i < keys.length; i++) {
	const nextKey = keys[i];
	result[nextKey] = nextSource[nextKey];
      }
    }
  }
  return result;
};
