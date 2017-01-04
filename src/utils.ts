function isObject(item: any): item is Object {
  return typeof item === 'object' && !Array.isArray(item);
}

export function merge(...objects: any[]): any { // .length of function is 2
  const result: any = {};
  for (const nextSource of objects) {
    if (isObject(nextSource)) {
      const keys: string[] = Object.keys(nextSource);
      for (let i = 0; i < keys.length; i++) {
	const nextKey = keys[i];
	const nextItem = nextSource[nextKey]
	if (isObject(nextItem)) {
	  result[nextKey] = merge(result[nextKey], nextItem);
	} else {
	  result[nextKey] = nextItem;
	}
      }
    }
  }
  return result;
};
