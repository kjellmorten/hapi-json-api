'use strict';

const IsJsonApiRequest = function (request) {

    if (!request.headers.accept) {
        return false;
    }

    if (request.headers.accept.indexOf('application/vnd.api+json') === -1) {
        return false;
    }

    return true;
};

module.exports = IsJsonApiRequest;
