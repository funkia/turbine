import {Component, h, input, br, button} from "../../src/DOMBuilder";
import {Events, empty, scan, map} from "../../src/Events";
import {Behavior, stepper} from "../../src/Behavior";
import {mount, declareBehaviors} from "../../src/bootstrap";

const cons = <A>(a: A, as: A[]): A[] => [a].concat(as);

const createLi = (): Component => h("li", ["List element"]);

function app(): Component {
  const addElement = empty();
  const elementsE = scan<Component, Component[]>(
    cons,
    [],
    map(createLi, addElement)
  );
  const list: Behavior<Component[]> = stepper([], elementsE);
  return h("div", [
    {click: addElement.def} = button("Add element"),
    h("ul", [list])
  ]);
}

mount("body", app);
