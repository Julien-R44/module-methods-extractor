# @julr/module-methods-extractor

🪛 Utility module to extract public methods for a given default Typescript export. Used by the Adonis.js VSCode extension

> The module is tailored for Adonis.js only, which helps in optimizing the way we scan the source code AST.


## Installation
```bash
pnpm add @julr/module-methods-extractor
```

## Usage
```ts
import { Extractor } from '@julr/module-methods-extractor'

const extractor = new Extractor()

const response = extractor.extract(`
  export default class UserController {
    public async index () {}

    public async store () {}
  }
`)

assert.deepEqual(response, {
  kind: 'class',
  methods: [
    { name: 'index', lineno: 2 },
    { name: 'store', lineno: 5 },    
  ]
})
```

## Features supported
- ESM `export default` is supported.
- Handle inline class declarations like `export default UserController {}`.
- Returns `lineno` for all methods.
- Use `@babel/parser` instead of the Typescript Compiler API to parse the source code. This results in a much lighter dependency ( 274KB instead of 3.32MB)

## Limitations
- Only supports ESM. Commonjs `module.exports` is not supported. ( Maybe later ? )
- The export reference must be located as a top level property. For example:
    ```ts
    const someObject = {
      prop: class UserController {}
    }

    export default someObject.prop
    ```

    The above expression is not something we advocate in the Adonis.js eco-system and also it is not a great pattern to use either.

## Acknowledgements

- [Harminder Virk](https://github.com/thetutlage) for developping the [initial version of this module](https://github.com/poppinss/module-methods-extractor).

## License

[MIT](./LICENSE.md) License © 2022 [Julien Ripouteau](https://github.com/Julien-R44)
