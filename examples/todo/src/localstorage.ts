import { withEffects } from "@funkia/io";
import { Behavior, fromFunction } from "@funkia/hareactive";

export function itemBehavior<A = any>(key: string): Behavior<A | null> {
  return fromFunction(() => JSON.parse(localStorage.getItem(key)!));
}

export const setItemIO = withEffects((key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
});

export const removeItemIO = withEffects((key: string) => {
  localStorage.removeItem(key);
});
