# OpenfortKit

The easiest way to integrate Openfort to your project, with built-in authentication and seamless wallet connectivity.

It offers a simple, customizable UI. Supports authentication providers like Google, X, or Facebook out of the box. Access your address through Openfort’s [embedded wallet solution](https://www.openfort.xyz/docs/guides/javascript/embedded-signer/recovery) or connect their own wallet provider effortlessly.

## Features

- 💡 TypeScript Ready — Get types straight out of the box.
- 🌱 Ecosystem Standards — Uses top libraries such as [wagmi](https://github.com/wagmi-dev/wagmi).
- 🖥️ Simple UX — Give users a simple, attractive experience.
- 🎨 Beautiful Themes — Predesigned themes or full customization.

and much more...

## Quick Start

### New app

Get started with `create-react-app` Openfortkit + [wagmi](https://wagmi.sh/) + [viem](https://viem.sh) project by running one of the following in your terminal:

#### npm

```sh
npx create-react-app my-app --template cra-template-openfortkit
```

#### yarn

```sh
yarn create react-app my-app --template cra-template-openfortkit
```

#### pnpm

```sh
pnpm dlx create-react-app ./my-app --template cra-template-openfortkit
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

There are various runnable examples included in this repository in the [examples folder](https://github.com/family/connectkit/tree/main/examples):

- [Create React App Example (TypeScript)](https://github.com/openfort-xyz/fortkit/tree/main/examples/cra)
- [Next.js Example (TypeScript)](https://github.com/openfort-xyz/fortkit/tree/main/examples/nextjs)
- [Vite Example (TypeScript)](https://github.com/openfort-xyz/fortkit/tree/main/examples/vite)

### Running Examples Locally

Clone the ConnectKit project and install the necessary dependencies:

```sh
$ git clone git@github.com:family/connectkit.git
$ cd connectkit
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

See [LICENSE](https://github.com/openfort-xyz/fortkit/blob/main/LICENSE) for more information.

## Credits

OpenfortKit is a fork of [Connectkit](https://github.com/family/connectkit) developed by [Family](https://family.co). We're grateful to them for making Connectkit fast, beatiful and open-source.
