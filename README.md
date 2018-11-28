# hapi-json-api

Hapi plugin for enabling/enforcing [JSON-API specification](http://jsonapi.org).

Original project transferred from [@wraithgar](https://github.com/wraithgar).

[![Current Version](https://img.shields.io/npm/v/@gar/hapi-json-api.svg)](https://www.npmjs.org/package/@gar/hapi-json-api)
[![Build Status](https://travis-ci.org/kjellmorten/hapi-json-api.svg?branch=master)](https://travis-ci.org/kjellmorten/hapi-json-api)
[![NSP Status](https://nodesecurity.io/orgs/laboreum/projects/933c42d1-7af0-4d0b-82b5-08c4915afe6b/badge)](https://nodesecurity.io/orgs/laboreum/projects/933c42d1-7af0-4d0b-82b5-08c4915afe6b)
[![Greenkeeper badge](https://badges.greenkeeper.io/kjellmorten/hapi-json-api.svg)](https://greenkeeper.io/)

### Support

We support Hapi 17 from version 3.x, and have dropped support for Node < 8.6.

(If you're using Hapi < 17 and Node < 8.6, `npm install @gar/hapi-json-api@2.0.6`.)

## Getting started

### Installing

```shell
npm install @gar/hapi-json-api
```

## Example of use

```javascript
// where server is a hapi server

// For hapi 17:
await server.register({
    plugin: require('@gar/hapi-json-api'),
    options: {}
});

// Prior to hapi 17:
server.register({
    register: require('@gar/hapi-json-api'),
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
