import {Behavior, Stream} from "@funkia/hareactive";
import {Component, elements, modelView} from "../../../src";
import {combine} from "@funkia/jabz";
const {span, button, ul, li, a, footer, strong} = elements;
import { navigate, Router } from "@funkia/rudolph";
import {get} from "../../../src/utils";

import {mapTraverseFlat} from "./TodoApp";
import {Output as ItemOut} from "./Item";

export type Params = {
  todosB: Behavior<ItemOut[]>,
  areAnyCompleted: Behavior<boolean>
};

export type Out = {
  clearCompleted: Stream<any>
};

type FromView = {
  filterBtnAll: Stream<any>,
  filterBtnActive: Stream<any>,
  filterBtnCompleted: Stream<any>,
  clearCompleted: Stream<any>
};

const negate = (b: boolean): boolean => !b;
const isEmpty = (list: any[]) => list.length === 0;
const formatRemainer = (value: number) => ` item${(value === 1) ? "" : "s"} left`;

const filterItem = (name: string) => li(a({
  style: {
    cursor: "pointer"
  },
  output: {
    [`filterBtn${name}`]: "click"
  }
}, name));

const sumFalse = (l: boolean[]) => l.filter(negate).length;

const model = function* ({filterBtnActive, filterBtnAll, filterBtnCompleted, clearCompleted}: FromView, _1: any, _2: any, router: Router) {
  const navs = combine(
    filterBtnAll.mapTo("all"),
    filterBtnActive.mapTo("active"),
    filterBtnCompleted.mapTo("completed")
  );
  yield navigate(router, navs);
  return {clearCompleted};
};

const view = ({}, todosB: Behavior<ItemOut[]>, areAnyCompleted: Behavior<boolean>) => {
  const hidden = todosB.map(isEmpty);
  const itemsLeft = mapTraverseFlat(get("completed"), todosB).map(sumFalse);
  return footer({class: "footer", classToggle: {hidden}}, [
    span({class: "todo-count"}, [
      strong(itemsLeft),
      itemsLeft.map(formatRemainer)
    ]),
    ul({class: "filters"}, [
      filterItem("All"),
      filterItem("Active"),
      filterItem("Completed")
    ]),
    button({
      style: {visibility: areAnyCompleted.map((b) => b ? "visible" : "hidden")},
      class: "clear-completed", output: {clearCompleted: "click"}
    }, "Clear completed")
  ]);
};


const todoFooter = modelView(model, view);

export default todoFooter;


