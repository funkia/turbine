import {assert} from "chai";
import {merge} from "../src/utils";

describe("utils: merge", () => {
  it("last object is winning", () => {
    const a = {
      name: "Alice",
      age: 24
    };
    const b = {
      name: "Bob",
      age: 41
    };
    const ab = merge(a, b);
    assert.deepEqual(ab, {name: "Bob", age: 41});
  });

  it("deep merging objects", () => {
    const deepObj1 = {
      user: {
	name: "Alice",
	age: 24
      },
      posts: []
    };
    const deepObj2 = {
      user: {
	name: "Bob",
	age: 41
      },
      posts: []
    };
    const result = merge(deepObj1, deepObj2);
    assert.deepEqual(result, deepObj2);
  });
});
