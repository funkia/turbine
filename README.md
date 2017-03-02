<img align="right" src="https://avatars0.githubusercontent.com/u/21360882?v=3&s=200">

# Funnel
A purely functional frontend framework based on functional reactive programming. Experimental.

[![Build Status](https://travis-ci.org/Funkia/funnel.svg?branch=master)](https://travis-ci.org/Funkia/funnel)
[![codecov](https://codecov.io/gh/Funkia/funnel/branch/master/graph/badge.svg)](https://codecov.io/gh/Funkia/funnel)
[![Sauce Test Status](https://saucelabs.com/browser-matrix/funnel.svg)](https://saucelabs.com/u/funnel)

## Buzzwords you might like:

* Purely functional
* Reactive
* Component-based
* Implemented in TypeScript

## Ideas/features

* Use classic FRP to express values that changes over time and reactivity.
* A component-based architecture. Components are completely encapsulated and composable.
  Components are monads and are typically used and composed with do-notation.
* Do not use virtual DOM. Instead constructed DOM elements reacts directly to behaviors and streams.
  This avoids the overhead of doing virtual DOM diffing and should lead to great performance.
* Side-effects are expressed with a declarative IO-like monad. This allows for easy
  testing of effectful code.
* The entire dataflow through applications is explicit and easy to follow.

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
