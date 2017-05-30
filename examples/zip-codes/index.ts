import {
  Behavior, Stream, Now, performStreamLatest, stepper, changes, split, sample
} from "@funkia/hareactive";
import { combine, IO, withEffectsP, catchE, Either, left, right } from "@funkia/jabz";

import { Component, modelView, runComponent, elements } from "../../src/index";
const { span, br, input } = elements;

const apiUrl = "http://api.zippopotam.us/us/";

const fetchJSON = withEffectsP((url: string): Promise<any> => {
  return fetch(url).then((resp) => resp.ok ? resp.json() : Promise.reject("Not found"));
});

function fetchZip(zip: string): IO<Either<string, string>> {
  return catchE((err) => IO.of(left(err)), fetchJSON(apiUrl + zip).map(right));
}

const isValidZip = (s: string) => s.match(/^\d{5}$/) !== null;

type Place = {
  "place name": string,
  state: string
};

type ZipResult = {
  country: string,
  places: Place[]
}

type ToView = {
  status: Behavior<string>
};

type ViewOut = {
  zipCode: Behavior<string>
};

function* model({ zipCode }: ViewOut): Iterator<Now<any>> {
  // A stream that occurs whenever the current zip code changes
  const zipCodeChange = changes(zipCode);
  // Split the zip code changes into those that represent valid zip
  // codes and those that represent invalid zip codes.
  const [validZipCodeChange, invalidZipCodeChange] = split(isValidZip, zipCodeChange);
  // A stream of IO requests for each time the zipCode changes
  const requests = validZipCodeChange.map(fetchZip);
  // A stream of results obtained from performing the IO requests
  const results: Stream<Either<string, ZipResult>> = yield performStreamLatest(requests);
  const status = yield sample(stepper(
    "",
    combine(
      invalidZipCodeChange.mapTo("Not a valid zip code"),
      validZipCodeChange.mapTo("Loading ..."),
      results.map((r) => r.match({
        left: () => "Zip code does not exist",
        right: (res) => `Valid zip code for ${res.places[0]["place name"]}`
      }))
    )
  ));
  return { status };
}

function* view({ status }: ToView): Iterator<Component<any>> {
  yield span("Please type a valid US zip code: ");
  const { inputValue: zipCode } = yield input({ props: { placeholder: "Zip code" } });
  yield br;
  yield span(status);
  return { zipCode };
}

const main = modelView<ToView, ViewOut>(model, view)();

runComponent("#mount", main);
