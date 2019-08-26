import { combine, Stream } from "@funkia/hareactive";
import { elements, runComponent, component } from "../../src";

const { input, div, label } = elements;

type On = {
  fahrenChange: Stream<string>;
  celsiusChange: Stream<string>;
};

const getValue = (ev: any) => ev.currentTarget.value;

const parseNumbers = (s: Stream<string>) =>
  s.map(parseFloat).filter((n) => !isNaN(n));

const main = component<On>((on) => {
  const fahrenNrChange = parseNumbers(on.fahrenChange);
  const celsiusNrChange = parseNumbers(on.celsiusChange);
  const celsius = combine(
    celsiusNrChange,
    fahrenNrChange.map((f) => (f - 32) / 1.8)
  );
  const fahren = combine(
    fahrenNrChange,
    celsiusNrChange.map((c) => (c * 9) / 5 + 32)
  );

  return div([
    div([
      label("Fahrenheit"),
      input({ value: fahren }).use((o) => ({
        fahrenChange: o.input.map(getValue)
      }))
    ]),
    div([
      label("Celsius"),
      input({ value: celsius }).use((o) => ({
        celsiusChange: o.input.map(getValue)
      }))
    ])
  ]);
});

// `runMain` should be the only impure function in application code
runComponent("#mount", main);
