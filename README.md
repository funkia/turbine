<img align="right" src="https://avatars0.githubusercontent.com/u/21360882?v=3&s=200">

# Funnel
A functional reactive frontend framework for building webapplications.

## Buzzwords you might like:
* Functional
* Reactive
* Component-based
* TypeScript


## Getting started

### Installation
```sh
npm install @funkia/funnel
```
Funnel uses two peer dependencies, that you'll need to install too:
* [hareactive](https://github.com/Funkia/hareactive) (Pure FRP library)
* [jabz](https://github.com/Funkia/jabz) (Monads, Do-notation and stuff)
```sh
npm install --save jabz hareactive
```

## Contributing

Run tests once with the below command. It will additionally generate
an HTML coverage report in `./generated/coverage-html`.

```sh
npm test
```

Continuously run the tests with

```sh
npm run test-watch
```
