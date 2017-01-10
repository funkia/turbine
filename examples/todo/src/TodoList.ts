import {
  Behavior, stepper, scan, sink,
  Stream, snapshot, filter,
  Now, sample
} from "hareactive";
import {Item, item} from "./Item";

import {Component, list, elements} from "../../../src";
const {ul, checkbox, section} = elements;

const isEmpty = (list: any[]) => list.length == 0;

type ToView = {
  todoNames: Behavior<string[]>;
};

export default ({todoNames}: ToView) => {
  return section ({
    class: "main",
    classToggle: {
      hidden: todoNames.map(isEmpty)
    }
  }, [
    checkbox({class: "toggle-all"}),
    ul({class: "todo-list"}, list(item, (a: string, index: number) => a + index, todoNames))
  ]);
}
