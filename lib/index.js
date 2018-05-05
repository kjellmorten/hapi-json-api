'use strict';

// Load modules
const Boom = require('boom');
const MediaType = require('media-type');


const isntJsonApiRequest = function isntJsonApiRequest(request) {

    if (!request.headers.accept) {
        return true;
    }

    if (request.headers.accept.indexOf('application/vnd.api+json') === -1) {
        return true;
    }

    return false;
};

module.exports = {
    pkg: require('../package.json'),
    register: (server, options) => {

        const meta = options.meta || {};

        server.ext('onPreHandler', function validateAcceptAndContentTypeHeaders(request, respToolkit) {

            if (isntJsonApiRequest(request)) {
                return respToolkit.continue;
            }

            const contentType = request.headers['content-type'];

            if (contentType) {
                const contentMedia = MediaType.fromString(contentType);

                // Ignore charset=UTF-8 media type parameter
                // https://github.com/json-api/json-api/issues/837
                if (contentMedia.parameters.charset === 'UTF-8') {
                    delete contentMedia.parameters.charset;
                }

                //Hapi does not allow application/* w/o json suffix so we don't need to test for it
                if (contentMedia.type !== 'application' || contentMedia.subtype !== 'vnd.api' || Object.keys(contentMedia.parameters).length > 0) {

                    throw Boom.unsupportedMediaType('Only `application/vnd.api+json` content-type supported');
                }
            }
            return respToolkit.continue;
        });

        server.ext('onPreResponse', function convertBoomErrorsToJsonApiFormat(request, respToolkit) {

            const response = request.response;

            if (request.method === 'options') {
                return respToolkit.continue;
            }

            if (isntJsonApiRequest(request)) {
                return respToolkit.continue;
            }

            if (response.isBoom) {
                const error = {
                    title: response.output.payload.error,
                    status: response.output.statusCode,
                    detail: response.output.payload.message
                };
                response.output.payload = {
                    errors: [error],
                    meta: { ...{ id: request.info.id }, ...meta }
                };
                response.output.headers['content-type'] = 'application/vnd.api+json';
            }
            else {
                if (response.source) {
                    response.source.meta = { ...{ id: request.info.id }, ...meta };
                }
                response.headers['content-type'] = 'application/vnd.api+json';
            }
            return respToolkit.continue;
        });

    }
};






