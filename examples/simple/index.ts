import { map, Now, Behavior } from "@funkia/hareactive";
import { elements, modelView, runComponent } from "../../src";
const { span, input, div } = elements;

const isValidEmail = (s: string) => /.+@.+\..+/i.test(s);

const model = ({ email }: { email: Behavior<string> }) => {
  const isValid = email.map(isValidEmail);
  return Now.of({ isValid });
};

const view = ({ isValid }: { isValid: Behavior<boolean> }) => [
  span("Please enter an email address: "),
  input().output({ email: "inputValue" }),
  div(["The address is ", map((b) => (b ? "valid" : "invalid"), isValid)])
];

const app = modelView(model, view);

runComponent("#mount", app());
