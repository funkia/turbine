import {Behavior} from "hareactive";
import {Component, dynamic, elements} from "../../../src";
const {span, button, label, ul, li, a, footer, strong} = elements;

export type Params = {
  todosB: Behavior<any[]>
};

const length = (list: any[]) => list.length;
const isEmpty = (list: any[]) => list.length == 0;
const formatRemainer = (value: number) => ` item${(value == 1)?"":"s"} left`;
const filterItem = (name: string) => li(a(name));

export default ({todosB}: Params) => {
  const hidden = todosB.map(isEmpty);
  const lengthB = todosB.map(length);
  return footer({class: "footer", classToggle: {hidden}}, [
    span({class: "todo-count"}, [strong(lengthB), lengthB.map(formatRemainer)]),
    ul({class: "filters"}, [
      filterItem("All"),
      filterItem("Active"),
      filterItem("Completed")
    ]),
    button({class: "clear-completed"}, "Clear completed")
  ]);
}
