const { go, lift, combine } = require("@funkia/jabz")
const {runComponent, elements, modelView} = require("../../src")

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
