// Load modules

var Hoek = require('hoek');
var Boom = require('boom');
var mediaType = require('media-type');
var pack = require('../package.json');


// Declare internals
var internals = {};

// Validates accept and content-type headers
internals.onPreHandler = function (request, reply) {

    var acceptHeader = request.headers.accept;
    var contentType = request.headers['content-type'];

    if (!acceptHeader) {
        return reply(Boom.badRequest('Missing `Accept` header'));
    }

    var acceptMedia = mediaType.fromString(acceptHeader);

    if (!acceptMedia.isValid() || acceptMedia.type !== 'application' || acceptMedia.subtype !== 'vnd.api') {

        return reply(Boom.badRequest('Invalid `Accept` header. Only `application/vnd.api+json` supported'));
    }

    if (acceptMedia.suffix !== 'json'){

        return reply(Boom.badRequest('The requested format is not supported. Only `json` format is supported.'));
    }

    if (Object.keys(acceptMedia.parameters).length > 0) {

        return reply(Boom.notAcceptable('Media type parameters not allowed'));
    }

    if (contentType) {
        var contentMedia = mediaType.fromString(contentType);

        if (contentMedia.type !== 'application' || contentMedia.subtype !== 'vnd.api' || contentMedia.suffix !== 'json' || Object.keys(contentMedia.parameters).length > 0) {

            return reply(Boom.unsupportedMediaType('Only `application/vnd.api+json` content-type supported'));
        }
    }
    return reply.continue();
};

// Converts Boom errors to json-api format, adds meta info, sets content-type
internals.onPreResponse = function (request, reply) {

    var response = request.response;

    if (response.isBoom) {
        var error = {
            title: response.output.payload.error,
            status: response.output.statusCode,
            detail: response.output.payload.message
        };
        response.output.payload = {
            errors: [error]
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

    internals.meta = options.meta;

    plugin.ext('onPreHandler', internals.onPreHandler);
    plugin.ext('onPreResponse', internals.onPreResponse);

    return done();
};

exports.register.attributes = {
    name: pack.name,
    version: pack.version
};
