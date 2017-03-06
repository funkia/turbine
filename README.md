<img align="right" src="https://avatars0.githubusercontent.com/u/21360882?v=3&s=200">

# Funnel

A purely functional frontend framework based on functional reactive
programming. Experimental.

[![Build Status](https://travis-ci.org/Funkia/funnel.svg?branch=master)](https://travis-ci.org/Funkia/funnel)
[![codecov](https://codecov.io/gh/Funkia/funnel/branch/master/graph/badge.svg)](https://codecov.io/gh/Funkia/funnel)
[![Sauce Test Status](https://saucelabs.com/browser-matrix/funnel.svg)](https://saucelabs.com/u/funnel)

## Ideas/features

The goal of Funnel is to be a powerful framework for building frontend
applications in a purely functional way. Funnel is based on FRP and is
heavily inspired by functional techniques found in Haskell.

* Purely functional.
* Implemented in TypeScript. Later on we'd like to support PureScript
  as well.
* Based on classic FRP. Behaviors represents values that changes over
  time and streams provide reactivity. Funnel uses the FRP
  library [Hareactive](https://github.com/Funkia/hareactive).
* A component-based architecture. Components are encapsulated and
  composable. Components are monads and are typically used and
  composed with do-notation (do-notation is implemented with
  generators).
* Constructed DOM elements reacts directly to behaviors and streams.
  This avoids the overhead of using virtual DOM and should lead to
  great performance.
* Side-effects are expressed with a declarative IO-like monad. This
  allows for easy testing of effectful code. Furthermore, the IO-monad
  is integrated with FRP. This makes it possible to perform
  side-effects in response to user input.
* The entire dataflow through applications is explicit and easy to
  follow.

## High level overview

The key datatypes in Funnel are

* `Behavior` — Represents values that change over time.
* `Stream` — Represents discrete events that happen over time.

These are from FRP. They are documented in more detail in
the [Hareactive readme](https://github.com/Funkia/hareactive).

On top of those Funnel adds `Component`. A component represents a GUI
widget on the screen. Components are composable and combine into
components. A Funnel app is just one big component. There is no
difference between a top level component and child components.

Components expresses their logic through behaviors and streams, can
run IO-actions and add elements to the DOM.

![Component figure](https://rawgit.com/Funkia/funnel/master/component-figure.svg)

Components in Funnel are encapsulated. They can have completely
private state and selectively decide what output they deliver to their
parent.

## Example

The example below creates an input field and print whether or not it
is valid.

```js
import {map} from "jabz";
import {runMain, elements, loop} from "funnel";
const {span, input, div} = elements;

const isValidEmail = (s: string) => s.match(/.+@.+\..+/i);

const main = go(function*() {
  yield span("Please enter an email address: ");
  const {inputValue: email} = yield input();
  const isValid = map(isValidEmail, email);
  yield div([
    "The address is ", map((b) => b ? "valid" : "invalid", isValid)
  ]);
});

// `runMain` should be the only impure function in application code
runMain("#mount", main);
```

A few explanations to the above code:

* The `go` function and the generator expresses do-notation, i.e.
  monadic chaining. Here the monad is `Component`.
* The function `input` returns `Component<{inputValue:
  Behavior<string>}>`. We `yield` it which binds the `inputValue`
  behavior to `email`.
* Next the `isValidEmail` predicate is mapped over the `email`
  behavior and a `div` component describing the validation status is
  added.

## Examples

Approximately listed in order of increasing complexity.

* [Simple](/examples/simple) — Very simple example of an
  email validator.
* [Fahrenheit celsius](/examples/fahrenheit-celsius) — A
  converter between fahrenheit and celsius.
* [Zip codes](/examples/zip-codes) — A zip code validator.
  Shows one way of doing HTTP-requests with the IO-monad.
* [Continuous time](/examples/continuous-time) —
  Shows how to utilize continuous time.
* [Counters](/examples/counters) — A list of counters.
  Demonstrates nested components, managing a list of components and
  how child components can communicate with parent components.
* [Todo](/examples/counters) — An implementation of the
  classic TodoMVC application. Note: Routing is not implemented yet.

## Getting started

### Installation

```sh
npm install @funkia/funnel
```

Funnel uses two peer dependencies, that you'll need to install too:

* [hareactive](https://github.com/Funkia/hareactive) (Pure FRP library)
* [jabz](https://github.com/Funkia/jabz) (Monads, Do-notation and
  stuff)

```sh
npm install --save jabz hareactive
```

## Documentation

Nothing here yet. See the [examples](#examples).

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
