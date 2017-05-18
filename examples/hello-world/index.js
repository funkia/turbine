import { go, lift, combine } from "@funkia/jabz";
import {runComponent, elements, modelView} from "../../src"

const {span, input, div} = elements

const Node = div(`Hello from static Node!`)
// const Fn = () => div(`Hello from Function!`)

// const App = [
// 	Node,
// 	Fn
// ]

const main = go(function* () {
  yield div(`Hello`);
  return {};
});

runComponent("#mount", main)
