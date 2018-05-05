'use strict';

const PreHandler = require('./PreHandler');
const PreResponse = require('./PreResponse');

module.exports = {
    pkg: require('../package.json'),
    register: (server, options = {}) => {

        const meta = options.meta || {};

        server.ext('onPreHandler', PreHandler);
        server.ext('onPreResponse', PreResponse(meta));
    }
};
