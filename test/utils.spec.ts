import {assert} from "chai";
import {mergeDeep} from "../src/utils";

describe("utils: deepMerge", () => {
  it("last object is winning", () => {
    const a = {
      name: "Alice",
      age: 24
    };
    const b = {
      name: "Bob",
      age: 41
    };
    const ab = mergeDeep(a, b);
    assert.deepEqual(ab, {name: "Bob", age: 41});
  });
  it("merge two levels deep ", () => {
    const a = {
      name: "Alice",
      friend: {
	name: "john",
	age: 70
      }
    };
    const b = {
      name: "Bob",
      age: 41,
      friend: {name: "walter" }
    };
    const ab = mergeDeep(a, b);
    assert.deepEqual(ab, {
      name: "Bob",
      age: 41,
      friend: {
	name: "walter",
	age: 70
      }
    });
  });
});
