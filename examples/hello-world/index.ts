import { runComponent, elements } from "../../src"
const { label, span, input, div } = elements

// declare your main component as generator function,
// components from all yield expression will be combined in array of dom elements
// and displayed when the main component is run
const main = function* () {

  // will produce <div>Welcome from Turbine</div>
  yield div('Welcome from Turbine!')

  // will produce <input placehoder="Your name?" autofocus="true"> 
  // will store the behavior of the input values in the 'name' variable
  const { inputValue: name } = yield input({
    attrs: {
      autofocus: "true", 
      placeholder: "Your name?"
    }
  })

  // will produce <div>Hello, __</div> 
  // with __ replaced by the current value of 'name'
  // the 'name' will instantly update as user types in the <input> field
  yield div(['Hello, ', name])
}

// `runMain` should be the only impure function in application code
runComponent("#mount", main);
