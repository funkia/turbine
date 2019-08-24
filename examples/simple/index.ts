import { elements, runComponent, component } from "../../src";
import { Behavior } from "@funkia/hareactive";
const { span, input, div } = elements;

const isValidEmail = (s: string) => /.+@.+\..+/i.test(s);

type On = { email: Behavior<string> };

const app = component<On>((on) => {
  const isValid = on.email.map(isValidEmail);
  return [
    span("Please enter an email address: "),
    input().output({ email: "value" }),
    div(["The address is ", isValid.map((b) => (b ? "valid" : "invalid"))])
  ];
});

runComponent("#mount", app);
