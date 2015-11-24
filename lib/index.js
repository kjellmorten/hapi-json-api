// Load modules

var Hoek = require('hoek');
var Boom = require('boom');
var MediaType = require('media-type');
var Pack = require('../package.json');


// Declare internals
var internals = {};

// Validates accept and content-type headers
internals.onPreHandler = function (request, reply) {

    if (request.method === 'options') {
        return reply.continue();
    };

    if(request.headers.accept.indexOf('application/vnd.api+json') === -1) {
      return reply.continue();
    }

    /**
     * Accept parsing is complicated and there wasn't a library I could
     * quickly find to parse them.  At the expense of missing out
     * on part of the spec, we're gonna skip this for now till
     * we can come back to it
     */
    //var acceptHeader = request.headers.accept;
    //var acceptMedia = MediaType.fromString(acceptHeader);

    //if (!acceptMedia.isValid() || acceptMedia.type !== 'application' || (acceptMedia.suffix !== 'json' && acceptMedia.subtype !== 'json') ) {

        //return reply(Boom.badRequest('Invalid `Accept` header. Must be able to accept `application/json` in some form'));
    //}

    //if (Object.keys(acceptMedia.parameters).length > 0) {

        //return reply(Boom.notAcceptable('Media type parameters not allowed'));
    //}

    var contentType = request.headers['content-type'];

    if (contentType) {
        var contentMedia = MediaType.fromString(contentType);

        //Hapi does not allow application/* w/o json suffix so we don't need to test for it
        if (contentMedia.type !== 'application' || contentMedia.subtype !== 'vnd.api' || Object.keys(contentMedia.parameters).length > 0) {

            return reply(Boom.unsupportedMediaType('Only `application/vnd.api+json` content-type supported'));
        }
    }
    return reply.continue();
};

// Converts Boom errors to json-api format, adds meta info, sets content-type
internals.onPreResponse = function (request, reply) {

    var response = request.response;

    if (request.method === 'options') {
        return reply.continue();
    }

    if(request.headers.accept.indexOf('application/vnd.api+json') === -1) {
      return reply.continue();
    }

    if (response.isBoom) {
        var error = {
            title: response.output.payload.error,
            status: response.output.statusCode,
            detail: response.output.payload.message
        };
        response.output.payload = {
            errors: [error],
            meta: Hoek.applyToDefaults({id: request.id}, internals.meta)
        };
        response.output.headers['content-type'] = 'application/vnd.api+json';
    } else {
        if (response.source) {
            response.source.meta = Hoek.applyToDefaults({id: request.id}, internals.meta);
        }
        response.headers['content-type'] = 'application/vnd.api+json';
    }
    return reply.continue();
};

// Exports

exports.register = function (plugin, options, done) {

    internals.meta = options.meta || {};

    plugin.ext('onPreHandler', internals.onPreHandler);
    plugin.ext('onPreResponse', internals.onPreResponse);

    return done();
};

exports.register.attributes = {
    name: Pack.name,
    version: Pack.version
};
