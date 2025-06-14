![openfort_kit_8d6f715e38](https://github.com/user-attachments/assets/e652c9d8-c2ff-4f13-b046-405338fdea01)

<div align="center">
  <h4>
    <a href="https://www.openfort.io/">
      Website
    </a>
    <span> | </span>
    <a href="https://www.openfort.io/docs/products/kit/react/quickstart">
      Documentation
    </a>
    <span> | </span>
    <a href="https://www.openfort.io/docs/reference/api/authentication">
      API Docs
    </a>
    <span> | </span>
    <a href="https://x.com/openfort_hq">
      X
    </a>
        <span> | </span>
    <a href="https://create-next-app.openfort.xyz/">
      Demo
    </a>
  </h4>
</div>


# Openfort Kit

[![Downloads](https://img.shields.io/npm/dm/@openfort/openfort-kit.svg)](https://www.npmjs.com/package/@openfort/openfort-kit)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-openfort.io-blue)](https://www.openfort.io/docs/products/kit/react/quickstart)
[![Version](https://img.shields.io/npm/v/@openfort/openfort-js.svg)](https://www.npmjs.org/package/@openfort/openfort-js)


The easiest way to integrate Openfort to your project, with built-in authentication and seamless wallet connectivity.

It offers a simple, customizable UI. Supports authentication providers like Google, X, or Facebook out of the box. Access your address through Openfort’s [invisible wallet](https://www.openfort.io/docs/products/embedded-wallet/javascript) or connect their own wallet provider effortlessly.

Docs: https://www.openfort.io/docs/products/kit/react/quickstart

## Features

- 💡 TypeScript Ready — Get types straight out of the box.
- 🌱 Ecosystem Standards — Uses top libraries such as [wagmi](https://github.com/wagmi-dev/wagmi).
- 🖥️ Simple UX — Give users a simple, attractive experience.
- 🎨 Beautiful Themes — Predesigned themes or full customization.

and much more...

## Quick Start

### New app

Get started with `create` Openfortkit + [wagmi](https://wagmi.sh/) + [viem](https://viem.sh) project by running one of the following in your terminal:

#### npm

```sh
npx create openfortkit
```

#### yarn

```sh
yarn create openfortkit
```

#### pnpm

```sh
pnpm create openfortkit
```

### Import `OpenfortKit` to your project

Add OpenfortKit to your already existing project.

#### npm

```sh
npm install @openfort/openfort-kit @tanstack/react-query wagmi viem
```

#### yarn

```sh
yarn add @openfort/openfort-kit @tanstack/react-query wagmi viem
```

#### pnpm

```sh
pnpm add @openfort/openfort-kit @tanstack/react-query wagmi viem
```

## Documentation

You can find the full OpenfortKit documentation in the Family docs [here]().

## Examples

There are various runnable examples included in this repository in the [examples folder](https://github.com/openfort-xyz/openfort-kit/tree/main/examples):

- [Create React App Example (TypeScript)](https://github.com/openfort-xyz/openfort-kit/tree/main/examples/cra)
- [Next.js Example (TypeScript)](https://github.com/openfort-xyz/openfort-kit/tree/main/examples/nextjs)
- [Vite Example (TypeScript)](https://github.com/openfort-xyz/openfort-kit/tree/main/examples/vite)

### Running Examples Locally

Clone the FortKit project and install the necessary dependencies:

```sh
$ git clone git@github.com:openfort-xyz/openfort-kit.git
$ cd openfort-kit
$ yarn install
```

and start the code bundler:

```sh
$ yarn dev:kit
```

and then simply select the example you'd like to run:

```sh
$ yarn dev:vite # Vite
$ yarn dev:nextjs # Next.js
$ yarn dev:cra # Create React App
```

## License

See [LICENSE](https://github.com/openfort-xyz/openfort-kit/blob/main/LICENSE) for more information.

## Credits

OpenfortKit is a fork of [Connectkit](https://github.com/openfort-xyz/openfort-kit) developed by [Family](https://family.co). We're grateful to them for making Connectkit fast, beautiful and open-source.
