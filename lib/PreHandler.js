'use strict';

const Boom = require('boom');
const MediaType = require('media-type');
const IsJsonApiRequest = require('./IsJsonApiRequest');

const validateMediaType = function (contentType) {

    const contentMedia = MediaType.fromString(contentType);

    // Ignore charset=UTF-8 media type parameter
    // https://github.com/json-api/json-api/issues/837
    if (contentMedia.parameters.charset === 'UTF-8') {
        delete contentMedia.parameters.charset;
    }

    // Hapi does not allow application/* w/o json suffix so we don't need to test for it
    if (contentMedia.type !== 'application' || contentMedia.subtype !== 'vnd.api' || Object.keys(contentMedia.parameters).length > 0) {

        throw Boom.unsupportedMediaType('Only `application/vnd.api+json` content-type supported');
    }
};

const validateAcceptAndContentTypeHeaders = function (request, respToolkit) {

    if (!IsJsonApiRequest(request)) {
        return respToolkit.continue;
    }

    const contentType = request.headers['content-type'];
    if (contentType) {
        validateMediaType(contentType);
    }

    return respToolkit.continue;
};

module.exports = validateAcceptAndContentTypeHeaders;
