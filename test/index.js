var Boom = require('boom');
var Code = require('code');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Lab = require('lab');
var Joi = require('joi');

var lab = exports.lab = Lab.script();
var errorCheck = function (response, code, detail) {

    var payload = JSON.parse(response.payload);
    Code.expect(payload).to.include('errors');
    Code.expect(payload.errors).to.have.length(1);
    Code.expect(payload.meta).to.include('id');
    if (detail) {
        Code.expect(payload.errors[0].detail).to.include(detail);
    }
};

var failAction = function failAction (request, reply, source, error) {
    var meta = request.route.settings.validate[source].describe().meta;
    var statusCode = meta ? meta[0].statusCode : 400;

    reply(Boom.create(statusCode, error.message, error.data));
};

var serverSetup = function (server) {

    server.route({ method: 'GET', path: '/ok', handler: function (request, reply) {

        return reply({data: {id: 'ok', type: 'response' } });
    } });
    server.route({ method: 'POST', path: '/post', handler: function (request, reply) {

        return reply({data: {id: 'post', type: 'response' } });
    } });
    server.route({ method: 'GET', path: '/auth', handler: function (request, reply) {

        return reply(Boom.unauthorized('need auth'));
    } });
    server.route({ method: 'DELETE', path: '/delete', handler: function (request, reply) {

        return reply().code(204);
    } });
    server.route({ method: 'GET', path: '/text', handler: function (request, reply) {

        return reply('ok').code(200).header('Content-Type', 'text/plain');
    } });
    server.route({ method: 'GET', path: '/validate/params/{id}', config: { validate: { params: { id: Joi.number() } } }, handler: function (request, reply) {

        return reply({data: {id: request.params.id} });
    } });
    server.route({ method: 'GET', path: '/validate/headers', config: { validate: { headers: { 'x-foo': Joi.string().required() } } }, handler: function (request, reply) {

        return reply({data: {id: 'ok'} });
    } });
    server.route({ method: 'GET', path: '/validate/query', config: { validate: { query: { 'good': Joi.any().valid('good') } } }, handler: function (request, reply) {

        return reply({data: {id: 'ok'} });
    } });
    server.route({ method: 'POST', path: '/validate/payload', config: { validate: { payload: { 'name': Joi.any().valid('cat') } } }, handler: function (request, reply) {

        return reply({data: {id: 'ok'} });
    } });
    server.route({ method: 'GET', path: '/validate/failaction/{id}', config: { validate: { params: { id: Joi.number() }, failAction: failAction } }, handler: function (request, reply) {

        return reply({data: {id: request.params.id} });
    } });
};


lab.experiment('hapi-json-api', function () {

    lab.experiment('with meta', function () {

        var server = new Hapi.Server();
        server.connection({
            routes: { cors: true }
        });
        var plugins = [{
            register: require('../'),
            options: { meta: { test: true} }
        }];


        lab.before(function (done) {

            serverSetup(server);
            server.register(plugins, function (err) {

                Hoek.assert(!err, 'Failed loading plugins: ' + err);

                server.start(function (err) {

                    Hoek.assert(!err, 'Failed starting server: ' + err);

                    return done();
                });
            });
        });

        lab.experiment('Content-Type', function () {

            lab.test('valid', function (done) {

                var options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json'
                    }
                };
                server.inject(options, function (response) {

                    var payload = JSON.parse(response.payload);
                    Code.expect(response.statusCode).to.equal(200);
                    Code.expect(payload).to.deep.include({data: {id: 'post'}});
                    done();
                });
            });

            lab.test('missing', function (done) {

                var options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': ''
                    }
                };
                server.inject(options, function (response) {

                    errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
                    done();
                });
            });

            lab.test('wrong type', function (done) {

                var options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'text/json'
                    }
                };
                server.inject(options, function (response) {

                    errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
                    done();
                });
            });

            lab.test('wrong subtype', function (done) {

                var options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/json'
                    }
                };
                server.inject(options, function (response) {

                    errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
                    done();
                });
            });

            lab.test('media type', function (done) {

                var options = {
                    method: 'POST', url: '/post',
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json;q=0.9'
                    }
                };
                server.inject(options, function (response) {

                    errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
                    done();
                });
            });

            // https://github.com/json-api/json-api/issues/837
            lab.test('media type is charset=utf-8', function (done) {

                var options = {
                    method: 'POST', url: '/post',
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json; charset=UTF-8'
                    }
                };
                server.inject(options, function (response) {

                    var payload = JSON.parse(response.payload);
                    Code.expect(response.statusCode).to.equal(200);
                    Code.expect(payload).to.deep.include({data: {id: 'post'}});
                    done();
                });
            });
        });

        lab.experiment('Boom replies', function () {

            lab.test('notfound', function (done) {

                var options = {
                    method: 'GET', url: '/missing',
                    headers: {
                        accept: 'application/vnd.api+json'
                    }
                };
                server.inject(options, function (response) {

                    errorCheck(response, 404);
                    var payload = JSON.parse(response.payload);
                    Code.expect(payload.meta.test).to.equal(true);
                    done();
                });

            });

            lab.test('unauthorized', function (done) {

                var options = {
                    method: 'GET', url: '/auth',
                    headers: {
                        accept: 'application/vnd.api+json'
                    }
                };
                server.inject(options, function (response) {

                    errorCheck(response, 401, 'need auth');
                    done();
                });

            });
        });

        lab.test('empty reply', function (done) {

            var options = {
                method: 'DELETE', url: '/delete',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, function (response) {

                Code.expect(response.statusCode).to.equal(204);
                Code.expect(response.payload).to.equal('');
                done();
            });
        });

        lab.test('options', function (done) {

            var options = {
                method: 'OPTIONS', url: '/ok',
                headers: {
                    Origin: 'http://localhost',
                    'Access-Control-Request-Method': 'GET'
                }
            };
            server.inject(options, function (response) {

                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });


        //Validation takes place at different points in the request lifecycle so we test
        //several of them to make sure they all work
        lab.test('request params validation', function (done) {
            var options = {
                method: 'GET', url: '/validate/params/a',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, function (response) {

                Code.expect(response.statusCode).to.equal(400);
                errorCheck(response, 400, '"id" must be a number');
                done();
            });
        });

        lab.test('request header validation', function (done) {
            var options = {
                method: 'GET', url: '/validate/headers',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, function (response) {

                Code.expect(response.statusCode).to.equal(400);
                errorCheck(response, 400, '"x-foo" is required');
                done();
            });
        });

        lab.test('request query validation', function (done) {
            var options = {
                method: 'GET', url: '/validate/query?good=bad',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, function (response) {

                Code.expect(response.statusCode).to.equal(400);
                errorCheck(response, 400, '"good" must be one of [good]');
                done();
            });
        });

        lab.test('request payload validation', function (done) {
            var options = {
                method: 'POST', url: '/validate/payload',
                payload: {
                    name: 'dog'
                },
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, function (response) {

                Code.expect(response.statusCode).to.equal(400);
                errorCheck(response, 400, '"name" must be one of [cat]');
                done();
            });
        });

        lab.test('request validation with failaction', function (done) {
            var options = {
                method: 'GET', url: '/validate/failaction/a',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, function (response) {

                Code.expect(response.statusCode).to.equal(400);
                errorCheck(response, 400, '"id" must be a number');
                done();
            });
        });
    });

    lab.experiment('without meta', function () {

        var server = new Hapi.Server();
        server.connection();

        var plugins = [{
            register: require('../'),
            options: {}
        }];


        lab.before(function (done) {

            serverSetup(server);
            server.register(plugins, function (err) {

                Hoek.assert(!err, 'Failed loading plugins: ' + err);

                server.start(function (err) {

                    Hoek.assert(!err, 'Failed starting server: ' + err);

                    return done();
                });
            });
        });

        lab.test('valid response', function (done) {

            var options = {
                method: 'GET', url: '/ok',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, function (response) {

                var payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload).to.deep.include({data: {id: 'ok'}});
                Code.expect(payload.meta).to.include('id');
                Code.expect(response.headers['content-type']).to.equal('application/vnd.api+json');
                done();
            });
        });

        lab.test('boom response', function (done) {

            var options = {
                method: 'GET', url: '/missing',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, function (response) {

                errorCheck(response, 404);
                done();
            });
        });

        lab.test('without accept header', function (done) {

            var options = {
                method: 'GET', url: '/text',
                headers: {}
            };
            server.inject(options, function (response) {

                var payload = response.payload
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(response.headers['content-type']).to.equal('text/plain; charset=utf-8');
                Code.expect(payload).to.equal('ok');
                done();
            });
        });

        lab.test('with accept: text/plain header', function (done) {

            var options = {
                method: 'GET', url: '/text',
                headers: {
                    accept: 'text/plain'
                }
            };
            server.inject(options, function (response) {

                var payload = response.payload
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload).to.equal('ok');
                done();
            });
        });

    });

});
