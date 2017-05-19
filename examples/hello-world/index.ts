import {map, go} from "@funkia/jabz"
import {runComponent, elements} from "../../src"
const {label, input, div} = elements

function* main() {
  yield label('Please enter your name:')
  // yield input()
  return input()
}

// `runMain` should be the only impure function in application code
runComponent("#mount", main);
