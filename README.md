<img align="right" src="https://avatars0.githubusercontent.com/u/21360882?v=3&s=200">

# Turbine

A purely functional frontend framework based on functional reactive
programming. Experimental.

[![Gitter](https://img.shields.io/gitter/room/funkia/General.svg)](https://gitter.im/funkia/General)
[![Build Status](https://travis-ci.org/funkia/turbine.svg?branch=master)](https://travis-ci.org/funkia/turbine)
[![codecov](https://codecov.io/gh/funkia/turbine/branch/master/graph/badge.svg)](https://codecov.io/gh/funkia/turbine)
[![Sauce Test Status](https://saucelabs.com/browser-matrix/funnel.svg)](https://saucelabs.com/u/funnel)

# Table of contents

* [Why Turbine?](#why-turbine)
* [Examples](#examples)
* [High-level overview](#high-level-overview)
* [Principles](#principles)
* [Installation](#installation)
* [More examples](#more-examples)
* [Tutorial](#tutorial)
* [API](#api)
* [Contributing](#contributing)

## Why Turbine?

The JavaScript world is full of frameworks. So why another one?
Because we want something _different_. We want something that is
purely functional without compromises. Something that takes the best
lessons from existing JavaScript frameworks and couples them with the
powerful techniques found in functional languages like Haskell. We
want a framework that is highly expressive. Because when functional
programming is at its best it gives you more power, not less. Turbine
is supposed to be approachable for typical JavaScript developers while
still preserving the benefits that comes from embracing purely
functional programming.

We have done our best to realize our goal. But we are not done yet. We
hope you will find Turbine interesting, try it and maybe even help us
making it even better.

## Examples

### Email validator

[See the example live here](https://codesandbox.io/s/jv74x1jny3?module=%2Fsrc%2Findex.js).

```js
const isValidEmail = (s: string) => s.match(/.+@.+\..+/i);

function* main() {
  yield span("Please enter an email address: ");
  const { inputValue: email } = yield input();
  const isValid = email.map(isValidEmail);
  yield div([
    "The address is ", map((b) => b ? "valid" : "invalid", isValid)
  ]);
}

// `runComponent` is the only impure function in application code
runComponent("#mount", main);
```

### Counter

[See the example live here](https://codesandbox.io/s/k9y0po3vv3?module=%2Fsrc%2Findex.js).

```js
const counterModel = fgo(function* ({ incrementClick, decrementClick }) {
  const increment = incrementClick.mapTo(1);
  const decrement = decrementClick.mapTo(-1);
  const changes = combine(increment, decrement);
  const count = yield sample(scan((n, m) => n + m, 0, changes));
  return { count };
});

const counterView = ({ count }) => div([
  "Counter ",
  count,
  button({ class: "btn btn-default", output: { incrementClick: "click" } }, "+"),
  button({ class: "btn btn-default", output: { decrementClick: "click" } }, "-")
]);

const counter = modelView(counterModel, counterView);
```

[See more examples here](#more-examples).

## High-level overview

Here our some of our key features.

* Purely functional. A Turbine app is made up of only pure functions.
* Leverage TypeScript and runtime checking to improve the developing
  experience.
* Based on classic FRP. Behaviors represents values that change over
  time and streams provide reactivity. Turbine uses the FRP
  library [Hareactive](https://github.com/funkia/hareactive).
* A component-based architecture. Components are immutable,
  encapsulated and composable. Components are monads and are typically
  used and composed with do-notation (we implement do-notation with
  generators).
* Constructed DOM elements reacts directly to behaviors and streams.
  This avoids the overhead of using virtual DOM and should lead to
  great performance.
* Side-effects are expressed with a declarative IO monad. This allows
  for easy testing of code with side-effects. Furthermore, the
  IO-monad is integrated with FRP.
* The entire data flow through applications is explicit and easy to
  follow.
* Our libraries are available both as CommonJS and ES2015 modules.
  This allows for tree-shaking.

Here are some of the features we want to implement and goals we're
working towards.

* Declarative and concise testing of time-dependent FRP code.
* Performance. We think Turbine can be made very efficient. But we are
  not yet at a point where we focus on performance.
* Support for server side rendering.
* Browser devtools for easier development and debugging.
* Hot-module replacement (if possible given our design).

## Principles

This section describes some of the key principles and ideas underlying
the design of Turbine.

### Purely functional

Turbine is purely functional. We mean that in the most strict sense of
the term. In a Turbine app, every single expression is pure. This
gives a huge benefit in how easy it is to understand and maintain a
Turbine app is.

One benefit of the complete purity is that every function in Turbine
supports what is called "referential transparency". This means that an
expression can always be replaced with its value.

As a simple example, say you have the following code:

```js
const view = div([
  myComponent({foo: "bar", something: 12}),
  myComponent({foo: "bar", something: 12})
]);
```

One may notice that `myComponent` is called twice with the exact same
arguments. Since all functions in a Turbine app are pure `myComponent`
is no exception. Hence, we can make the following simple refactoring.

```js
const component = myComponent({foo: "bar", something: 12}),
const view = div([
  component,
  component
]);
```

Such refactorings can always be safely done in Turbine.

### Completely explicit data flow

One significant challenge when writing an interactive frontend
application is how to manage the data flow through an application.

In Turbine we have strived to create an architecture where the data
flow is easy to follow and understand. For us, this means that when
looking at any piece of code it should be possible to see what other
parts of the application it affects and what other parts it is
affected by.

One manifestation of this principle is that in Turbine it is very
simple to see how the model affects the view and how the view affects
the model. The figure below illustrates this.

![modelView figure](https://rawgit.com/funkia/turbine/master/figures/explicit-dataflow.png)

The arrows represent data flow between the model and the view. Note
how these "conceptual arrows" are clearly expressed in the code. For
instance, by looking at the buttons we can see exactly what output
they produce.

### Declarative models

Imperative programming is about _doing_. Functional programming is
about _being_. This mean that ideally a functional program should be
about defining what things are. That property is what makes functional
programs declarative.

Below is a model from the [counters example](/examples/counters).
Notice how the model consists of nothing but a series of `const`
statements.

```js
function* counterModel({ incrementClick, decrementClick, deleteClick }) {
  const increment = incrementClick.mapTo(1);
  const decrement = decrementClick.mapTo(-1);
  const deleteS = deleteClick.mapTo(id);
  const count = yield sample(scan(add, 0, combine(increment, decrement)));
  return { count, deleteS };
}
```

Each line is a declaration of a piece of the state. All models in
Turbine follows this pattern. This makes state in a Turbine app very
easy to understand. One can look at a single definition and be certain
that it tells everything there is to know about that specific piece of
state.

This is in sharp contrast to frameworks that mutate state or
frameworks where state is stepped forward by reducer functions. With
such approaches a single piece of state can potentially be affected
and changed in several places. That can make it hard to understand how
the state evolves. The benefits of having a definition as a
single source of truth is lost.

## Installation

```sh
npm install @funkia/turbine @funkia/hareactive
```

[Hareactive](https://github.com/funkia/hareactive) is a peer
dependency. It is the FRP library that that Turbine is based upon.

Alternatively, for quickly trying out Turbine you may want to see our
[Turbine starter kit](https://github.com/funkia/turbine-starter).

## More examples


Here is a series of examples that demonstrate how to use Turbine.
Approximately listed in order of increasing complexity.

* [Simple](/examples/simple) — Very simple example of an email
  validator.
* [Fahrenheit celsius](/examples/fahrenheit-celsius) — A converter
  between fahrenheit and celsius.
* [Zip codes](/examples/zip-codes) — A zip code validator. Shows one
  way of doing HTTP-requests with the IO-monad.
* [Continuous time](/examples/continuous-time) — Shows how to utilize
  continuous time.
* [Counters](/examples/counters) — A list of counters. Demonstrates
  nested components, managing a list of components and how child
  components can communicate with parent components.
* [Todo](/examples/todo) — An implementation of the classic
  TodoMVC application.

## Tutorial

In this tutorial, we will build a simple application with a list of
counters. The application will be simple but not completely trivial.
Along the way, most of the key concepts in Turbine will be explained.
We will see how to create HTML, how to create custom components, how a
component can be nested and how it can share state with its parent.

Please open an issue if you have questions regarding the tutorial or
ideas for improvements.

The final result and the intermediate states can be seen by cloning
this git repository, going into the directory with the counters
example and running webpack to serve the application.

```
git clone https://github.com/funkia/turbine/
cd turbine/examples/counters
npm run start
```

### FRP

Turbine builds on top of the FRP library Hareactive. The two key
concepts from FRP are _behavior_ and _stream_. They are documented in
more detail in the [Hareactive
readme](https://github.com/funkia/hareactive). But the most important
things to understand are behavior and stream.

* `Behavior` represents values that change over time. For instance,
  the position of the mouse or the number of times a user has clicked
  a button.
* `Stream` represents discrete events that happen over time. For
  instance click events.

### What is `Component`

On top of the FRP primitives Turbine adds `Component`. Component is the
key concept in Turbine. Once you understand `Component`—and how to use
it—you understand Turbine. A Turbine app is just one big component.

Here is a high-level overview of what a component is.

* Components can __contain logic__ expressed through operations on
  behaviors and streams.
* Components are __encapsulated__ and have completely private state.
* Components __contain output__ through which they selectively decide
  what state they share with their parent.
* Components __write DOM elements__ as children to their parent. They
  can write zero, one or more DOM elements.
* Components can __declare side-effects__ expressed as `IO`-actions.
* Components are __composable__—one component can be combined with
  another component and the result is a third component.

A `Component` in Turbine is pure and immutable. A `Component` can be
thought of as a huge description of all of the above mentioned things.
For instance, a `Component` contains a description about what its DOM
look like. That part is a bit like virtual DOM. But, on top op that
the description also explain how the DOM changes over time. The
description also tells what output the `Component` contains. More on
that later.

### Creating HTML-elements

Turbine includes functions for creating components that represent
standard HTML-elements. When you create your own components they will
be made of these.

The element functions accept two arguments, both of which are
optional. The first is an object describing various things like
attributes, classes, etc. The second argument is a child component.
For instance, to create a div with a span child we would write.

```typescript
const myDiv = div({class: "foo"}, span("Some text"));
```

The element functions are overloaded. So instead of giving `span` a
component as child we can give it a string. The element functions also
accept an array of child elements like this.

```typescript
const myDiv = div({class: "foo"}, [
  h1("A header"),
  p("Some text")
])
```

Using this we can build arbitrarily complex HTML. As an example we
will build a simple view for a counter in our counter-application.

```ts
import { elements, runComponent } from "@funkia/turbine";
const { br, div, button } = elements;

// Counter
const counterView = div([
  "Counter ",
  1,
  " ",
  button("+"),
  " ",
  button("-")
]);

runComponent("body", counterView);
```

We define `counterView` as div-element with some text and two buttons
inside. Since `div` returns a component `counterView` is a component.
And a Turbine application is just a component so we have a complete
application. We run the application on the last line when we call
`runComponent`. It is an impure function that takes a selector, a
component and runs the component with the found element as parent. You
can view the entire code in `version1.ts`.

### Dynamic HTML

The `counterView` above is completely static. The buttons do nothing
and we hard-coded the value `1` into the view. Our next task is to
make the program interactive.

Anywhere where we can give the element functions a constant value of a
certain type we can alternatively give them a behavior with a value of
that type. For instance, if we have a string-valued behavior we can
use it like this

```ts
const mySpan = span(stringBehavior);
```

This will construct a component representing a span element with text
content that is kept up to date with the value of the behavior.

To make the count in our counter view dynamic we turn it into a
function that takes a behavior of a number and inserts it into the
view.

```ts
const counterView = ({ count }: CounterViewInput) => div([
  "Counter ",
  count,
  " ",
  button("+"),
  " ",
  button("-"),
]);
```

Because it will be easier going forward `counterView` takes an object
with a `count` property.

### Output from components

The above covers the _input_ to the counter view. We now need to get
_output_ from it.

Remember that we mentioned how a Turbine component is a description
about what the component will behave and look like. Part of that
description also explains what output will come from the component.
Components are represented by a generic type `Component<A>`. The `A`
represents the output of the component. I.e. `Component<A>` means:
"I'm a component that will give you `A` as output".

To get a feel for what "output" means it may be helpful to mention a
few examples.

* A button will output a stream of click events. So the type of a
  button may be `Component<Stream<Event>>`
* A input box could output a behavior of the text inside the input.
  It's type would be `Component<Behavior<string>>`
* A checkbox might output a behavior representing wether it is checked
  or not. It would have type `Component<Behavior<A>>`.

In practice a component will almost always output more than a single
stream or behavior. The output type is therefore often an object as
that is most convenient.

Let's see what an input element actually looks like.

```ts
const usernameInput =
  input({attrs: {placeholder: "Username"}, output: {username: "inputValue"}});
```

Here `usernameInput` has the type

```ts
Component<{username: Behavior<string>}>
```

An `input` element produces a string valued behavior named
`inputValue` that contains the current content of the `input` element.
We then give the `input` function an object `output` that tells it to
output the behavior with the property `username`.

Back to the counters app. We want our counter view to produce two
streams as output. One stream should be from whenever the first button
is clicked and the other stream should contain clicks from the second
button. That is, the view's output should have the type

```ts
{incrementClick: Stream<ClickEvent>, decrementClick: Stream<ClickEvent>}
```

The simplest way to get achieve that looks like this:

```ts
const counterView = ({ count }) => div([
  "Counter ",
  count,
  button({ output: { incrementClick: "click" } }, "+"),
  button({ output: { decrementClick: "click" } }, "-"),
]);
```

The `output` object given to the `button` functions tells them what
output we're interested in. They will only produce that output. The
first button will output an object with a stream named
`incrementClick` and the later with one named `decrementClick`.

The `div` function will combine all the objects output by the
components in the array passed to it and output that. The result is
that `counterView` returns a component that produces two streams as
output.

### Adding a model

We now need to add a model with some logic to our counter view. The
model needs to handle the increment and decrement stream and turn them
into a behavior that represents the current count.

Turbine offers the function `modelView` for creating components with
logic. `modelView` takes two arguments. The first describes the logic
and the second the view. This keeps the logic neatly separated from
the view.

The second argument to `modelView`, the view, is a function that
returns a component. We already have such a function: `counterView`.

The first argument is a function that returns a `Now`-computation. You
don't have to fully understand `Now`. One of the things it does is to
make it possible to create stateful behaviors. The model function will
as input receive the output from the component that the view function
returns. The result of the `Now`-computation will be passed on to the 
view function and will be the output of the component that `modelView` 
returns. Here is how we use to create our counter component.

```ts
function* counterModel(
  { incrementClick, decrementClick }: CounterModelInput
) {
  const increment = incrementClick.mapTo(1);
  const decrement = decrementClick.mapTo(-1);
  const changes = combine(increment, decrement);
  const count = yield sample(scan((n, m) => n + m, 0, changes));
  return { count };
}

const counter = modelView(counterModel, counterView)();
```

Note that there is a cyclic dependency between the model and the view.
The figure below illustrates this.

![modelView figure](https://rawgit.com/funkia/turbine/master/figures/model-view.svg)

We now have a fully functional counter. You have now seen how to
create a simple component with encapsulated state and logic. The
current code can be seen in `version2.ts`.

### Creating a list of counters

Our next step is to create a list of counters. To do that we will
create a new component called `counterList`. The component will
contain a list of `counter` components as well as a button for adding
counters to the list.

Let's begin by defining a view function that creates a header and a
button.

```js
function* counterListView(): {
  yield h1("Counters");
  const { click: addCounter } = yield button({ class: "btn btn-primary" }, "Add counter");
  return { addCounter };
}
```

We hook the view up to a model using `modelView`. Again, the model
function receives the return value from the view function.

```js
function* counterListModel({ addCounter }) {
  return [{}, {}];
}

function* counterListView(): {
  yield h1("Counters");
  const { click: addCounter } = yield button({ class: "btn btn-primary" }, "Add counter");
  return { addCounter };
}

const counterList = modelView(counterListModel, counterListView);
```

To create a dynamic list of counter we have to use the `list` function.

## Documentation

### Understanding generator functions

Turbine's use of generator functions may seem a bit puzzling at first.
For instance, it may seem like generator functions serve two different
purposes. One when they're used in the model and another when they're
used in the view

But, what they do under the hood is exactly the same in both cases.
The key to understand is that generator functions is just sugar for
calling [`chain`](#componentchain) several times in succession.

When we use `chain` on components we can combine elements and pipe
output from one component into the next. The code below combines two
`input` elements with a `span` element that shows the concatenation of
the text in the two input fields.

```typescript
input({ attrs: { placeholder: "foo" } }).chain(
  ({ inputValue: aValue }) => input().chain(
    ({ inputValue: bValue }) => {
      const concatenated = lift((a, b) => a + b, aValue, bValue);
      return span(["Concatenated text: ", concatenated]).mapTo({concatenated});
    }
  )
);
```

However, the above code is very awkward as each invocation of `chain`
adds an extra layer of nesting. To solve this problem we use
generators.

```typescript
go(function*() {
  const {inputValue: aValue} = yield input();
  const {inputValue: bValue} = yield input();
  const concatenated = lift((a, b) => a + b, aValue, bValue);
  yield span(["Concatenated text: ", concatenated]);
  return {concatenated};
});
```

The above code does exactly the same as the previous example. But it
is a lot easier to read!

The `go` function works like this. We yield a value with a `chain`
method. `go` then calls `chain` on the yielded value. `go` calls
`chain` with a function that continues the generator function with the
value that `chain` passes it. The end result is a value of the same
type that we yield inside the generator function. When we `yield` a
`Component<A>` we will get an `A` back inside the generator function.

Finally we `return` a value and that value will be the output of the
component that `go` returns.

Here is another example. The following code uses `chain` explicitly.

```ts
const view = button("Accept")
  .chain(({click: acceptClick}) => button("Reject")
    .map(({click: rejectClick}) => ({acceptClick, rejectClick}))
  );
```

The above code is equivalent to the following.

```ts
const view = go(function* () {
  const {click: acceptClick} = yield button("Accept");
  const {click: rejectClick} = yield button("Reject");
  return {acceptClick, rejectClick};
});
```

Again, the code that uses generator functions is a lot easier to read.
This is why they're useful in Turbine.

`Component` is not the only type in Turbine that has a `chain` method.
`Now` and `Behavior` does as well. And since `go` is only sugar for
calling `chain` it works with these types as well.

## API

The API documentation is incomplete. See also the
[examples](#examples), the [tutorial](#tutorial), the [Hareactive
documentation](https://github.com/funkia/hareactive) and this tutorial
about [IO](https://github.com/funkia/io).

### Component

#### `Component#map`

Mapping over a component is a way of applying a function to the output
of a component. If a component has output of type `A` then we can map
a function from `A` to `B` over the component and get a new component
whose output is of type `B`.

In the example below `input` creates a component with an object as
output. The object contains a behavior named `inputValue`. The
function given to `map` receives the output from the component. 

We then call `map` on the behavior `inputValue` and take the length of
the string. The result is that `usernameInput` has the type
`Component<Behavior<number>>` because it's mapped output is a
number-valued behavior whose value is the current length of the text
in the input element.

```ts
const usernameInput =
  input({class: "form-control"})
    .map((output) => output.inputValue.map((s) => s.length));
```

#### `Component#chain`

`map` makes it possible to transform and change the output from a
component. However, it does not make it possible to take output from
one component and pipe it into another component. That is where
`chain` enters the picture. The type of the `chain` method is as
follows.

```typescript
chain((output: Output) => Component<NewOutput>): Component<NewOutput>;
```

The `chain` method on a components with output `Output` takes a
function that takes `Output` as argument and returns a new component.
Here is an example. An invocation `component.chain(fn)` returns a new
component that works like this:

* The output from `component` is passed to `fn`.
* `fn` returns a new component, let's call it `component2`
* The DOM-elements from `component` and `component2` are both added to
  the parent.
* The output is the output from `component2`.

Here is an example.

```typescript
input().chain((inputOutput) => span(inputOutput.inputValue));
```

The above example boils down to this:

```typescript
Create input component   Create span component with text content
  ↓                             ↓
input().chain((inputOutput) => span(inputOutput.inputValue));
                   ↑                                ↑
      Output from input-element       Behavior of text in input-element
```

The result is an input element followed by a span element. When
something is written in the input the text in the span element is
updated accordingly.

### `loop`

Sometimes situations arise where there is a cyclic dependency between
two components.

For instance, you may have a function that creates a component that
shows the value of an input string-value behavior and outputs a
string-valued behavior.

```typescript
const myComponent = (b: Behavior<string>) => span(b).chain((_) => input());
```

Now we'd have a cyclic dependency if we wanted to construct two of
these views so that the first showed the output from the second and
the second showed output from the first. With `loop` we can do it like
this:

```typescript
loop(({output1, output2}) => go(function*() {
  const output1_ = yield myComponent(output2);
  const output2_ = yield myComponent(output1);
  return {output1: output1_, output2: output2_};
}));
```

The `loop` functional seems pretty magical. It has the following
signature (slightly simplified):

```ts
loop<A extends ReactiveObject>(f: (a: A) => Component<A>): Component<A>
```

I.e. `loop` takes a function that returns a component whose output has
the same type as the argument to the function. `loop` then passes the
output in as argument to the function. That is, `f` will as argument
receive the output from the component it returns. The only restriction
is that the output from the component must be an object with streams
and/or behaviors as values.

Visually it looks like this.

![loop figure](https://rawgit.com/funkia/turbine/master/figures/component-loop.svg)

### `modelView`

The `modelView` functions makes it possible to create components where
the view is decoupled from the model and its logic.

`modelView` takes two arguments:

* The model which is a function that returns a `Now` computation. The
  `Now` computation is run when the component is being created.
* The view which is a function that returns a `Component`.

`modelView` establishes a circular dependency between the model and
the view. The model returns a `Now` computation and the result of this
computation is passed into the view function. The view function then
returns a component. The output of the component is passed to the
model function.

Visually the circular dependency looks like this.

![modelView figure](https://rawgit.com/funkia/turbine/master/figures/model-view.svg)

`modelView` returns a _function_ that returns a component. The
arguments given to this function will be passed along to both the
model and the view functions. This makes it easy to create components
that take input.

```js
const myComponent = modelView(
  (outputFromView, arg1, arg2) => ...,
  (outputFromModel, arg1, arg2) => ...
);

myComponent("foo", "bar");
```

## Contributing

Turbine is developed by Funkia. We write functional libraries. You can
be a part of it too. Share your feedback and ideas. We also love PRs.

Run tests once with the below command. It will additionally generate
an HTML coverage report in `./coverage`.

```sh
npm test
```

Continuously run the tests with

```sh
npm run test-watch
```
