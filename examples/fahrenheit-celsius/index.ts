import {fgo} from "jabz/monad";
import {Behavior, stepper} from "hareactive/behavior";
import {Stream, combine} from "hareactive/stream";
import {Now} from "hareactive/now";

import {Component, component, runMain, elements, loop} from "../../src";
const {input, div, label} = elements;

type ToView = {
  celsius: Behavior<number>,
  fahren: Behavior<number>
};

type ViewOut = {
  fahrenChange: Stream<string>,
  celsiusChange: Stream<string>,
};

const getValue = (ev: any) => ev.currentTarget.value;

const main = loop(fgo(function*({fahren, celsius}: ToView) {
  const {fahrenInput} = yield div([
    label("Fahrenheit"),
    input({props: {value: fahren}, name: {input: "fahrenInput"}})
  ]);
  const {celsiusInput} = yield div([
    label("Celcious"),
    input({props: {value: celsius}, name: {input: "celsiusInput"}})
  ]);
  const fahrenChange = fahrenInput.map(getValue);
  const celsiusChange = celsiusInput.map(getValue);

  const fahrenNrChange = fahrenChange.map(parseFloat).filter((n) => !isNaN(n));
  const celsiusNrChange = celsiusChange.map(parseFloat).filter((n) => !isNaN(n));
  celsius = stepper(0, combine(celsiusChange, fahrenNrChange.map((f) => (f - 32) / 1.8)));
  fahren = stepper(0, combine(fahrenChange, celsiusNrChange.map((c) => c * 9 / 5 + 32)));
  return {celsius, fahren};
}
);

// `runMain` should be the only impure function in application code
runMain("#mount", main);
