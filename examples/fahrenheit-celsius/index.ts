import { Behavior, combine, sample, stepper, Stream } from "@funkia/hareactive";
import { elements, fgo, modelView, runComponent, toComponent } from "../../src";

const { input, div, label } = elements;

type Model = {
  celsius: Behavior<number>;
  fahren: Behavior<number>;
};

type View = {
  fahrenChange: Stream<string>;
  celsiusChange: Stream<string>;
};

const getValue = (ev: any) => ev.currentTarget.value;

const parseNumbers = (s: Stream<string>) =>
  s.map(parseFloat).filter((n) => !isNaN(n));

const model = fgo(function*({ fahrenChange, celsiusChange }: View) {
  const fahrenNrChange = parseNumbers(fahrenChange);
  const celsiusNrChange = parseNumbers(celsiusChange);
  const celsius = yield sample(
    stepper(
      0,
      combine(celsiusNrChange, fahrenNrChange.map((f) => (f - 32) / 1.8))
    )
  );
  const fahren = yield sample(
    stepper(
      0,
      combine(fahrenNrChange, celsiusNrChange.map((c) => (c * 9) / 5 + 32))
    )
  );
  return { celsius, fahren };
});

const view = ({ fahren, celsius }: Model) =>
  div([
    div([
      label("Fahrenheit"),
      input({ value: fahren, output: { fahrenInput: "input" } })
    ]),
    div([
      label("Celsius"),
      input({ value: celsius, output: { celsiusInput: "input" } })
    ])
  ]).output((o) => ({
    fahrenChange: o.fahrenInput.map(getValue),
    celsiusChange: o.celsiusInput.map(getValue)
  }));

const main = modelView<Model, View>(model, view)();

// `runMain` should be the only impure function in application code
runComponent("#mount", main);
