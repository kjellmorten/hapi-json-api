# hapi-json-api

*Note:* This package has been archived, as the maintainer moved away from Hapi
when the project was first discontinued. Hapi seems to be alive again, but this
package will not be updated anymore. It is updated to Hapi 21, but this is done
naivly without much testing. Use it if it works. :)

Hapi plugin for enabling/enforcing [JSON-API specification](http://jsonapi.org).

Original project transferred from [@wraithgar](https://github.com/wraithgar).

[![Current Version](https://img.shields.io/npm/v/@gar/hapi-json-api.svg)](https://www.npmjs.org/package/@gar/hapi-json-api)
[![Greenkeeper badge](https://badges.greenkeeper.io/kjellmorten/hapi-json-api.svg)](https://greenkeeper.io/)

### Support

We support Hapi 21 from version 4.x, and require Node >= 14.15.

## Getting started

### Installing

```shell
npm install @gar/hapi-json-api
```

## Example of use

```javascript
const jsonApi = require('@gar/hapi-json-api');

// where server is a hapi server, for hapi 21:
await server.register({
    plugin: jsonApi,
    options: {}
});
```

### Configuration

Pass an optional `meta` parameter to options to have that included in
the `meta` response namespace for all replies from your server

## Features

- Enforces Accept/Content-type rules defined in spec

- Rewrites Boom errors to be spec compliant

**Note:** Objects coming back from your handlers is not validated as of now.
It is assumed to be in proper json-api format and simply passed on.

## Contributing

Please read [CONTRIBUTING](https://github.com/kjellmorten/hapi-json-api/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/kjellmorten/hapi-json-api/blob/master/LICENSE.md) file for details.
