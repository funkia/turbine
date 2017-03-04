<img align="right" src="https://avatars0.githubusercontent.com/u/21360882?v=3&s=200">

# Funnel
A purely functional frontend framework based on functional reactive programming. Experimental.

[![Build Status](https://travis-ci.org/Funkia/funnel.svg?branch=master)](https://travis-ci.org/Funkia/funnel)
[![codecov](https://codecov.io/gh/Funkia/funnel/branch/master/graph/badge.svg)](https://codecov.io/gh/Funkia/funnel)
[![Sauce Test Status](https://saucelabs.com/browser-matrix/funnel.svg)](https://saucelabs.com/u/funnel)

## Ideas/features

* Purely functional.
* Implemented in TypeScript.
* Uses classic FRP. Behaviors represents values that changes over time
  and streams provide reactivity.
* A component-based architecture. Components are completely encapsulated and composable.
  Components are monads and are typically used and composed with do-notation.
* Do not use virtual DOM. Instead constructed DOM elements reacts directly to behaviors and streams.
  This avoids the overhead of doing virtual DOM diffing and should lead to great performance.
* Side-effects are expressed with a declarative IO-like monad. This allows for easy
  testing of effectful code.
* The entire dataflow through applications is explicit and easy to follow.

## Example

```js
import {map} from "jabz";
import {runMain, elements, loop} from "funnel";
const {span, input, div} = elements;

const isValidEmail = (s: string) => s.match(/.+@.+\..+/i);

const main = loop(function*({email}) {
  const isValid = map(isValidEmail, email);
  yield span("Please enter an email address: ");
  const {inputValue: email_} = yield input();
  yield div([
    "The address is ", map((b) => b ? "valid" : "invalid", isValid)
  ]);
  return {email: email_};
});

// `runMain` should be the only impure function in application code
runMain("#mount", main);
```

## Getting started

### Installation
```sh
npm install @funkia/funnel
```
Funnel uses two peer dependencies, that you'll need to install too:
* [hareactive](https://github.com/Funkia/hareactive) (Pure FRP library)
* [jabz](https://github.com/Funkia/jabz) (Monads, Do-notation and stuff)
```sh
npm install --save jabz hareactive
```

## Documentation

Not there yet. See the examples.

## Contributing

Run tests once with the below command. It will additionally generate
an HTML coverage report in `./coverage`.

```sh
npm test
```

Continuously run the tests with

```sh
npm run test-watch
```
