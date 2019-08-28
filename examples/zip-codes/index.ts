import * as H from "@funkia/hareactive";
import {
  catchE,
  combine,
  Either,
  IO,
  left,
  right,
  withEffectsP
} from "@funkia/jabz";
import { elements as E, runComponent, component } from "../../src/index";

const apiUrl = "http://api.zippopotam.us/us/";

const fetchJSON = withEffectsP(
  (url: string): Promise<any> => {
    return fetch(url).then((resp) =>
      resp.ok ? resp.json() : Promise.reject("Not found")
    );
  }
);

function fetchZip(zip: string): IO<Either<string, ZipResult>> {
  return catchE((err) => IO.of(left(err)), fetchJSON(apiUrl + zip).map(right));
}

const isValidZip = (s: string) => s.match(/^\d{5}$/) !== null;

type Place = {
  "place name": string;
  state: string;
};

type ZipResult = {
  country: string;
  places: Place[];
};

type ViewOut = {
  zipCode: H.Behavior<string>;
};

const main = component<ViewOut>((on, start) => {
  const zipCodeChange = H.changes(on.zipCode);
  // Split the zip code changes into those that represent valid zip
  // codes and those that represent invalid zip codes.
  const [validZipCodeChange, invalidZipCodeChange] = H.split(
    isValidZip,
    zipCodeChange
  );
  // A stream of IO requests for each time the zipCode changes
  const requests = validZipCodeChange.map(fetchZip);
  // A stream of results obtained from performing the IO requests
  const results = start(H.performStreamLatest(requests));
  const status = start(
    H.stepper(
      "",
      combine(
        invalidZipCodeChange.mapTo("Not a valid zip code"),
        validZipCodeChange.mapTo("Loading ..."),
        results.map((r) =>
          r.match({
            left: () => "Zip code does not exist",
            right: (res) => `Valid zip code for ${res.places[0]["place name"]}`
          })
        )
      )
    )
  );

  return [
    E.span("Please type a valid US zip code: "),
    E.input({
      props: { placeholder: "Zip code" }
    }).use({ zipCode: "value" }),
    E.br,
    E.span(status)
  ];
});

runComponent("#mount", main);
