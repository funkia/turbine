import { isBehavior } from "@funkia/hareactive";

function arrayConcat<A>(arr1: A[], arr2: A[]): A[] {
  const result = [];
  for (let i = 0; i < arr1.length; ++i) {
    result.push(arr1[i]);
  }
  for (let i = 0; i < arr2.length; ++i) {
    result.push(arr2[i]);
  }
  return result;
}

export function fst<A, B>(a: [A, B]): A {
  return a[0];
}

export function snd<A, B>(a: [A, B]): B {
  return a[1];
}

function isObject(item: any): item is Object {
  return typeof item === "object" && !Array.isArray(item) && !isBehavior(item);
}

export function get<K extends string>(prop: K): any {
  return <V, Obj extends Record<K, V>>(obj: Obj): Obj[K] => obj[prop];
}

export function assign<A, B>(a: A, b: B): A & B {
  for (const key of Object.keys(b) as (keyof B)[]) {
    (a as any)[key] = b[key];
  }
  return a as any;
}

export function mergeObj<A, B>(a: A, b: B): A & B {
  const c: { [key: string]: any } = {};
  for (const key of Object.keys(a) as (keyof A & string)[]) {
    c[key] = a[key];
  }
  for (const key of Object.keys(b) as (keyof B & string)[]) {
    c[key] = b[key];
  }
  return <any>c;
}

export type Merge<T> = { [K in keyof T]: T[K] };

export function mergeDeep(...objects: any[]): any {
  // .length of function is 2
  const result: any = {};
  for (const source of objects) {
    if (isObject(source)) {
      const keys: string[] = Object.keys(source);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const nextItem = source[key];
        if (Array.isArray(source[key]) && Array.isArray(result[key])) {
          result[key] = arrayConcat(result[key], source[key]);
        } else if (isObject(source[key])) {
          const subKeys: string[] = Object.keys(source[key]);
          result[key] = result[key] || {};
          for (let j = 0; j < subKeys.length; j++) {
            const nextSubKey = subKeys[j];
            result[key][nextSubKey] = nextItem[nextSubKey];
          }
        } else {
          result[key] = nextItem;
        }
      }
    }
  }
  return result;
}

export function copyRemaps(
  remap: Record<string, string>,
  source: Record<string, any>
): Record<string, any> {
  const output: Record<string, any> = {};
  for (let key in remap) {
    output[key] = source[remap[key]];
  }
  return output;
}

export function id<A>(a: A): A {
  return a;
}
