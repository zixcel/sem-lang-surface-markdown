# @hathq/sem-lang-surface-markdown

Extract source-linked document structure from Markdown for downstream interpretation.

## What you can do

- Parse CommonMark structure.
- Retain document and field evidence in a common format.

## Current scope

The package provides structural evidence. Meaning, actions and document mutation belong to the caller.

Package distribution is not activated by this documentation. Use the checked-in source and the declared dependency versions; published availability must be verified separately.

## Getting started

The manifest currently requires locally supplied package archives: `@hathq/sem-lang-structured-surface`. These archives are excluded from Git. Obtain the exact approved dependency artifacts before installing; a fresh clone alone is not sufficient. Registry distribution remains pending.

Use the package manager matching the checked-in lockfile and the Node.js version declared in `package.json` or the development configuration. Run from this repository:

```sh
npm install
npm run test
```

## Documentation and source

[Usage guide](docs/getting-started.md)

[Implementation and public interfaces](src) · [Verification cases](test) · [Contributing](CONTRIBUTING.md) · [Security reporting](SECURITY.md) · [License](LICENSE) · [Attribution notices](NOTICE)
