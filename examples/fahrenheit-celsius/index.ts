import {stepper} from "hareactive/behavior";
import {Stream, combine} from "hareactive/stream";

import {runMain, elements, loop} from "../../src";
const {input, div, label} = elements;

type Looped = {
  fahrenChange: Stream<string>,
  celsiusChange: Stream<string>,
};

const getValue = (ev: any) => ev.currentTarget.value;

const main = loop(function*({fahrenChange, celsiusChange}: Looped) {
  // Model
  const fahrenNrChange = fahrenChange.map(parseFloat).filter((n) => !isNaN(n));
  const celsiusNrChange = celsiusChange.map(parseFloat).filter((n) => !isNaN(n));
  const celsius = stepper(0, combine(celsiusChange, fahrenNrChange.map((f) => (f - 32) / 1.8)));
  const fahren = stepper(0, combine(fahrenChange, celsiusNrChange.map((c) => c * 9 / 5 + 32)));

  // View
  const {fahrenInput} = yield div([
    label("Fahrenheit"),
    input({props: {value: fahren}, output: {input: "fahrenInput"}})
  ]);
  const {celsiusInput} = yield div([
    label("Celcious"),
    input({props: {value: celsius}, output: {input: "celsiusInput"}})
  ]);

  return {
    fahrenChange: fahrenInput.map(getValue),
    celsiusChange: celsiusInput.map(getValue)
  };
});

// `runMain` should be the only impure function in application code
runMain("#mount", main);
