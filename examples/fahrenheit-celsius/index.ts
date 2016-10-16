import {go} from "jabz/monad";
import {Behavior, stepper} from "hareactive/Behavior";
import {Stream, merge} from "hareactive/Stream";
import {Now} from "hareactive/Now";

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

const main = component<ToView, ViewOut, {}>({
  model: ({fahrenChange, celsiusChange}) => go(function*(): Iterator<Now<any>> {
    const fahrenNrChange = fahrenChange.map(parseFloat).filter(n => !isNaN(n));
    const celsiusNrChange = celsiusChange.map(parseFloat).filter(n => !isNaN(n));
    const celsius = stepper(0, merge(celsiusChange, fahrenNrChange.map(f => (f - 32) / 1.8)));
    const fahren = stepper(0, merge(fahrenChange, celsiusNrChange.map(c => c * 9/5 + 32)));
    return Now.of([{celsius, fahren}, {}]);
  }),
  view: ({celsius, fahren}) => go(function*(): Iterator<Component<any>> {
    const {children: {input: fahrenInput}} = yield div(go(function*() {
      yield label("Fahrenheit");
      return input({props: {value: fahren}});
    }));
    const {children: {input: celsiusInput}} = yield div(go(function*() {
      yield label("Celcious");
      return input({props: {value: celsius}});
    }));
    return Component.of({
      fahrenChange: fahrenInput.map(getValue),
      celsiusChange: celsiusInput.map(getValue)
    });
  }),
});

// `runMain` should be the only impure function in application code
runMain("#mount", main);
