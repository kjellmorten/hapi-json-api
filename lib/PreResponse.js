'use strict';

const IsJsonApiRequest = require('./IsJsonApiRequest');

const prepareOutput = function (request, meta) {

    const { response } = request;
    const { output } = response;

    if (request.response.isBoom) {
        const error = {
            title: output.payload.error,
            status: output.statusCode,
            detail: output.payload.message
        };
        output.payload = {
            errors: [error],
            meta: { id: request.info.id, ...meta }
        };
        output.headers['content-type'] = 'application/vnd.api+json';
    }
    else {
        if (response.source) {
            response.source.meta = { id: request.info.id, ...meta };
        }

        response.headers['content-type'] = 'application/vnd.api+json';
    }
};

const PreResponse = function (meta) {

    return function convertBoomErrorsToJsonApiFormat(request, respToolkit) {

        // Skip for OPTIONS requests and requests that don't accept application/vnd.api+json
        if (request.method === 'options' || !IsJsonApiRequest(request)) {
            return respToolkit.continue;
        }

        // Prepare output with correct headers and format
        prepareOutput(request, meta);

        return respToolkit.continue;
    };
};

module.exports = PreResponse;
