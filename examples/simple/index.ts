import {map} from "jabz";
import {runMain, elements, loop} from "../../src";
const {span, input, div} = elements;

const isValidEmail = (s: string) => s.match(/.+@.+\..+/i);

const main = loop(function*({email}) {
  const isValid = map(isValidEmail, email);
  yield span("Please enter an email address: ");
  const {inputValue: email_} = yield input();
  yield div([
    "The address is ", map((b) => b ? "valid" : "invalid", isValid)
  ]);
  return {email: email_};
});

// `runMain` should be the only impure function in application code
runMain("#mount", main);
