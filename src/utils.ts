function isObject(item: any): item is Object {
  return typeof item === 'object' && !Array.isArray(item);
}

export function merge(a: any, b: any): any {
  const c: {[key: string]: any} = {};
  for (const key in a) {
    c[key] = a[key];
  }
  for (const key in b) {
    c[key] = b[key];
  }
  return c;
}

export function mergeDeep(...objects: any[]): any { // .length of function is 2
  const result: any = {};
  for (const nextSource of objects) {
    if (isObject(nextSource)) {
      const keys: string[] = Object.keys(nextSource);
      for (let i = 0; i < keys.length; i++) {
	const nextKey = keys[i];
	const nextItem = nextSource[nextKey];
	if (isObject(nextSource[nextKey])) {
	  const subKeys: string[] = Object.keys(nextSource[nextKey]);
	  result[nextKey] = result[nextKey] || {};
	  for (let j = 0; j < subKeys.length; j++) {
	    const nextSubKey = subKeys[j];
	    result[nextKey][nextSubKey] = nextItem[nextSubKey];
	  }
	} else {
	  result[nextKey] = nextItem;
	}
      }
    }
  }
  return result;
};
