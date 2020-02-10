<p align="center"><a href="https://www.justauthenticate.me" target="_blank" rel="noopener noreferrer"><img width="100" src="https://justauthenticateme.netlify.com/favicon.png" alt="JustAuthenticateMe logo"></a></p>
<p align="center">
  <a href="https://prettier.io/">
    <img alt="code style: prettier" src="https://badgen.net/badge/code style/prettier/ff69b4">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img alt="types: typescript" src="https://badgen.net/badge/types/TypeScript/blue">
  </a>
</p>
<h1 align="center">JustAuthenticateMe Node JS SDK</h1>

## Introduction

[JustAuthenticateMe](https://www.justauthenticate.me) offers simple magic link based authentication as a service for web apps. This is a tiny library for your node.js backend to verify ID Tokens from JustAuthenticateMe and otherwise interact with the service. If you're looking for the browser sdk, see [justauthenticateme-web](https://github.com/CoalesceSoftware/justauthenticateme-web).

## Getting Started

### Installing via npm or yarn

```
npm install --save justauthenticateme-web
yarn add justauthenticateme-web
```

### Importing

```js
import JustAuthenticateMe from "justauthenticateme-web";
```

### Initializing the library

Pass your App ID from the JustAuthenticateMe dashboard to the constructor.

```js
const appId = "dcd6555e-edff-4f3d-83c9-3af79ea8f895";
const jam = new JustAuthenticateMe(appId);
```

## Use Cases

### Verifying an ID Token

```js
const email = await jam.verify(idToken);
```

On the first call, this will fetch the public key for your app from the JustAuthenticateMe API and cache it for all future uses. It verifies the ID Token with your app's public key and pulls out the email from the JWT payload. If the token is invalid for any reason, an error will be thrown.

There is an optional second boolean argument for forcing a refetch of the public key. `jam.verify(idToken, true)` will _always_ make the API call to get your public key, even if it was already cached, and cache the results of that call.

### Fetching your app's Public Key

```js
const jwks = await jam.getJwks();
```

This will fetch the [JWKS](https://tools.ietf.org/html/rfc7517#section-5) representation of the public key for your app from the JustAuthenticateMe API. Currently, all apps will only have one key in the set.

### Authenticating a User

```js
await jam.initAuth("someone@example.com");
```

This will generate a magic link and send it to the email argument. Upon clicking the magic link the user will be redirected to the Redirect URL specified for your app in the JustAuthenticateMe Dashboard with an ID Token and Refresh Token (if enabled) as query string parameters.
Successful promise completion means the email was successfully generated and sent.

### Getting a new ID Token using a Refresh Token

```js
const newIdToken = await jam.refresh(refreshToken);
```

### Deleting a Refresh Token

```js
await jam.deleteRefreshToken(idToken, refreshToken);
```

`idToken` must be a valid ID Token for the user. `refreshToken` will no longer be valid after calling this function. It's recommended to call this function when logging out in addition to deleting the `refreshToken` from local memory.

### Deleting all Refresh Tokens (Sign Out Everywhere)

```js
await jam.deleteAllRefreshTokens(idToken);
```

`idToken` must be a valid ID Token for the user. Calling this function will invalidate all existing `refreshToken`s for the user, effectively logging the user out from all devices.

## License

[MIT](http://opensource.org/licenses/MIT)
