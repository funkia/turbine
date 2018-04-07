# Building HTML

Standard HTML elements can be created by using inbuilt functions.
These functions support settings attributes and properties on the
elements. They output streams corresponding to their events.

The API contains convenience features that makes it possible to
express common functionality in concise ways.

## Classes

Classes can be set on any element by defining the `class` property on
the objects given to the element.

The simplest way to declare classes is by giving a string of space
separated class names.

```ts
div({
  class: "foo bar baz"
});
```

The above will create a `div`-element with the classes "foo", "bar",
and "baz".

The above is useful for setting _static_ classes. That is, classes
that do not change over the lifetime of the component. In addition to
that there is two ways to declare _dynamic_ classes.

The first is by setting class to an `object` where the keys are class
names and where the values are behaviors of booleans. For each
key-value pair the class named by the key will be set on the element
whenever the corresponding behavior is `true` and removed whenever it
is `false`. Below is an example of this.

```ts
div({
  class: { foo: behavior1, bar: behavior2 }
})
```

The above will create an element that has the class "foo" when
`behavior1` is `true` and the class "bar" when `behavior2` is `true`.

Here is a more realistic example of this.

```ts
FIXME
```

Instead of a boolean valued behavior you may want to declare a class
based on a string valued behavior. When `class` is a string valued
behavior the current value of the behavior will be set as a class on
the element.

In the following example `batteryLevelView` shows the current level of
a device's battery. When the battery is getting low we want to
indicate this with various styling. Thus the battery percentage is
turned into a string valued behavior. This behavior is then used as a
class.

```ts
function batteryLevelView(batteryPercentage: Behavior<number>) {
  const indicatorClass = batteryPercentage.map((level) => {
    if (level < 5) {
      return "very-low";
    } else if (level < 25) {
      return "low";
    } else {
      return "ok";
    }
  });
  return div({class: indicatorClass}, [
    "Battery percentage: ", batteryPercentage, "%"
  ]);
}
```

All of the three ways to declare behaviors are useful in different
situations. But, often you want to combine them. To achieve this the
`class` property can be an array of the three things above.

```ts
div({
  class: [
    "static classes",
    { active: booleanBehavior },
    stringBehavior
  ]
})
```

A proper _class value_ is either a string, a string behavior, an object
of boolean behaviors, or an array of proper _class values_.

Note that the definition is recursive. This means that the array can
contain other arrays and so on. This is very useful when you want to
reuse class declarations with several components.


```ts
function badExample(
  accessLevel: Behavior<string>,
  isAdministrator: Behavior<boolean>
) {
  const classes = ["foo", accessLevel, { visible: isAdministrator }];
  return div({
    button({class: ["btn-primary", classes]}, "Add"),
    button({class: ["btn-danger", classes]}, "Delete")
  })
}
```