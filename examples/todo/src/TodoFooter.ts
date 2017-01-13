import {Behavior} from "hareactive";
import {traverse} from "jabz/traversable";
import {Component, dynamic, elements} from "../../../src";
const {span, button, label, ul, li, a, footer, strong} = elements;
import {get} from "../../../src/utils";

import {Out as ItemOut} from "./Item";

export type Params = {
  todosB: Behavior<ItemOut[]>
};

const negate = (b: boolean): boolean => !b;
const length = (list: any[]) => list.length;
const isEmpty = (list: any[]) => list.length == 0;
const formatRemainer = (value: number) => ` item${(value == 1)?"":"s"} left`;
const filterItem = (name: string) => li(a(name));
const sumFalse = (l: boolean[]) => l.filter(negate).length;

export default ({todosB}: Params) => {
  const hidden = todosB.map(isEmpty);
  todosB.map((l) => console.log(l));
  const itemsLeft = todosB
    .map((list) => traverse(Behavior, get("completed"), list))
    .flatten()
    .map(sumFalse)
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
    button({class: "clear-completed"}, "Clear completed")
  ]);
}
