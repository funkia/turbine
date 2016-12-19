// import "@types/whatwg-fetch";

import {Behavior, stepper} from "hareactive/behavior";
import {Stream, snapshot, merge, mergeList, changes} from "hareactive/stream";
import {Now, performStream} from "hareactive/now";
import {IO, withEffectsP} from "jabz/io";
import {Either, left, right} from "jabz/either";

import {Component, component, runMain, list, e, elements} from "../../src";
const {text, span, button, br, input, div} = elements;

const apiUrl = "http://api.zippopotam.us/us/";

const fetchJSON = withEffectsP((url: string): Promise<ZipResult> => {
  return fetch(url).then((resp) => resp.ok ? resp.json() : Promise.reject("Not found"));
});

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
  zipCode: Behavior<string>,
  zipInput: Stream<{}>
};

function* model({zipCode, zipInput}: ViewOut): Iterator<Now<any>> {
  // A stream that occurs whenever the current zip code changes
  const zipCodeChange = changes(zipCode);
  // Split the zip code changes into those that represent valid zip
  // codes and those that represent invalid zip codes.
  const validZipCodeChange = zipCodeChange.filter(isValidZip);
  const invalidZipCodeChange = zipCodeChange.filter((s) => !isValidZip(s));
  // A stream of IO requests for each time the zipCode changes
  const requests = validZipCodeChange.map((zip) => fetchJSON(apiUrl + zip));
  // A stream of results optained from performing the IO requests
  const results: Stream<Either<string, ZipResult>> = yield performStream(requests);
  const status = stepper(
    "",
    mergeList([
      invalidZipCodeChange.mapTo("Not a valid zip code"),
      validZipCodeChange.mapTo("Loading ..."),
      results.map((r) => {
        console.log(r);
        return r.match({
          left: () => "Zip code does not exist",
          right: (res) => `Valid zip code for ${res.places[0]["place name"]}`
        })
      })
    ])
  );
  return [{status}, {}];
}

function* view({status}: ToView): Iterator<Component<any>> {
  yield span("Please type a valid US zip code: ");
  const {inputValue: zipCode, input: zipInput} =
    yield input({props: {placeholder: "Zip code"}});
  yield br;
  yield span(status);
  return {zipCode, zipInput};
}

const main = component<ToView, ViewOut, {}>(model, view);

runMain("#mount", main);
