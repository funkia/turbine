import {just, Maybe, nothing, withEffects} from "@funkia/jabz";
import {runMain} from "../../../src";
import {app} from "./TodoApp";

export const getItemIO = withEffects((key: string): Maybe<any> => {
  const value = JSON.parse(localStorage.getItem(key));
  return value === null ? nothing : just(value);
});

export const setItemIO = withEffects((key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
});

runMain("body", app);
