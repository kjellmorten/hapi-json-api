# @gar/hapi-json-api

hapi plugin for enabling/enforcing json-api

## installing

```shell
npm install @gar/hapi-json-api
```

## use

```javascript
//where server is a hapi server

server.register({
    register: require('@gar/hapi-json-api')
    options: {}
});
```

## options

Pass an optional `meta` parameter to options to have that included in
the `meta` response namespace for all replies from your server

## notes

Assumes the objects coming back from your handlers return data in proper
json-api format. No validation yet.

Rewrites Boom errors to be spec compliant.

Enforces Accept/Content-type rules defined in spec
