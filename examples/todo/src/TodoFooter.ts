import {Behavior} from "hareactive";
import {elements} from "../../../src";
const {span, button, ul, li, a, footer, strong} = elements;
import {get} from "../../../src/utils";

import {mapTraverseFlat} from "./TodoApp";
import {Out as ItemOut} from "./Item";

export type Params = {
  todosB: Behavior<ItemOut[]>,
  areAnyCompleted: Behavior<boolean>
};

const negate = (b: boolean): boolean => !b;
const isEmpty = (list: any[]) => list.length === 0;
const formatRemainer = (value: number) => ` item${(value === 1) ? "" : "s"} left`;
const filterItem = (name: string) => li(a(name));
const sumFalse = (l: boolean[]) => l.filter(negate).length;

export default ({todosB, areAnyCompleted}: Params) => {
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
      class: "clear-completed", name: {click: "clearCompleted"}
    }, "Clear completed")
  ]);
}
