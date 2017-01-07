import {Behavior, stepper} from "hareactive/behavior";
import {Stream, merge} from "hareactive/stream";
import {Now} from "hareactive/now";

import {Component, component, runMain, elements} from "../../src";
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

const main = component<ToView, ViewOut, {}>(
  function model({fahrenChange, celsiusChange}: ViewOut) {
    const fahrenNrChange = fahrenChange.map(parseFloat).filter(n => !isNaN(n));
    const celsiusNrChange = celsiusChange.map(parseFloat).filter(n => !isNaN(n));
    const celsius = stepper(0, merge(celsiusChange, fahrenNrChange.map(f => (f - 32) / 1.8)));
    const fahren = stepper(0, merge(fahrenChange, celsiusNrChange.map(c => c * 9/5 + 32)));
    return Now.of([{celsius, fahren}, {}]);
  },
  function* view({celsius, fahren}: ToView) {
    const {input: fahrenInput} = yield div(function*() {
      yield label("Fahrenheit");
      return yield input({props: {value: fahren}});
    });
    const {input: celsiusInput} = yield div(function*() {
      yield label("Celcious");
      return yield input({props: {value: celsius}});
    });
    return {
      fahrenChange: fahrenInput.map(getValue),
      celsiusChange: celsiusInput.map(getValue)
    };
  }
);

// `runMain` should be the only impure function in application code
runMain("#mount", main);
