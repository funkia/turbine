import { Behavior, stepper, Stream, combine, sample } from "@funkia/hareactive";

import { runComponent, elements, loop, modelView, toComponent, fgo } from "../../src";
const { input, div, label } = elements;

type Model = {
  celsius: Behavior<number>,
  fahren: Behavior<number>
};

type View = {
  fahrenChange: Stream<string>,
  celsiusChange: Stream<string>
};

const getValue = (ev: any) => ev.currentTarget.value;

const model = fgo(function* ({ fahrenChange, celsiusChange }: View) {
  const fahrenNrChange = fahrenChange.map(parseFloat).filter((n) => !isNaN(n));
  const celsiusNrChange = celsiusChange.map(parseFloat).filter((n) => !isNaN(n));
  const celsius = yield sample(stepper(0, combine(celsiusNrChange, fahrenNrChange.map((f) => (f - 32) / 1.8))));
  const fahren = yield sample(stepper(0, combine(fahrenNrChange, celsiusNrChange.map((c) => c * 9 / 5 + 32))));
  return { celsius, fahren };
});

const view = ({ fahren, celsius }) => div([
  div([
    label("Fahrenheit"),
    input({ props: { value: fahren }, output: { fahrenInput: "input" } })
  ]),
  div([
    label("Celsius"),
    input({ props: { value: celsius }, output: { celsiusInput: "input" } })
  ])
]).map(({ fahrenInput, celsiusInput }) => ({
  fahrenChange: fahrenInput.map(getValue),
  celsiusChange: celsiusInput.map(getValue)
}));

const main = modelView<Model, View>(model, view)();

// `runMain` should be the only impure function in application code
runComponent("#mount", main);
