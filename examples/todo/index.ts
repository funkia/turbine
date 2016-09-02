import {stepper} from "../../src/Behavior";
import {h, button, Component, input} from "../../src/DOMBuilder";
import {Events, empty, snapshot} from "../../src/Events";
import {mount} from "../../src/bootstrap";

function app(): Component {
  const addClick$ = empty();
  const inputComponent = input();

  const todoItems: Events<any> = snapshot(inputComponent.inputValue, addClick$)
    .scan((todo, todoArr) => [...todoArr, todo[1]], [])
    .map((todoArr) => h("ul", todoArr.map((item) => h("li", [item]))));
  const todos = stepper(h("span"), todoItems);

  return h("div", [
    h("h1", ["Todo list:"]),
    inputComponent,
    {click: addClick$.def} = button("add"),
    h("br"),
    inputComponent.inputValue,
    h("br"),
    todos
  ]);
}

mount("body", app);
