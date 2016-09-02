import {Component, runComponentNow} from "./component";

/** Bootstrap the application */
export function runMain(selector: string, c: Component<any>): void {
  const element = document.querySelector(selector);
  runComponentNow(element, c);
}
