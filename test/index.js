'use strict';

const Boom = require('boom');
const { expect } = require('code');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');

const lab = exports.lab = Lab.script();

const errorCheck = function (response, code, detail) {

    const payload = JSON.parse(response.payload);
    expect(payload).to.include('errors');
    expect(payload.errors).to.have.length(1);
    expect(payload.meta).to.include('id');
    if (detail) {
        expect(payload.errors[0].detail).to.include(detail);
    }
};

const serverSetup = function (server) {

    server.route({ method: 'GET', path: '/ok', handler: function (request, reply) {

        return reply({ data: { id: 'ok', type: 'response' } });
    } });
    server.route({ method: 'POST', path: '/post', handler: function (request, reply) {

        return reply({ data: { id: 'post', type: 'response' } });
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
};


lab.experiment('hapi-json-api', () => {

    lab.experiment('with meta', () => {

        const server = new Hapi.Server();
        server.connection({
            routes: { cors: true }
        });
        const plugins = [{
            register: require('../'),
            options: { meta: { test: true } }
        }];


        lab.before((done) => {

            serverSetup(server);
            server.register(plugins, (err) => {

                Hoek.assert(!err, 'Failed loading plugins: ' + err);

                server.start((err) => {

                    Hoek.assert(!err, 'Failed starting server: ' + err);

                    return done();
                });
            });
        });

        //lab.experiment('Accept', function () {

        //lab.test('valid', function (done) {

        //var options = {
        //method: 'GET', url: '/ok',
        //headers: {
        //accept: 'application/vnd.api+json'
        //}
        //};
        //server.inject(options, function (response) {

        //var payload = JSON.parse(response.payload);
        //expect(response.statusCode).to.equal(200);
        //expect(payload).to.include({data: {id: 'ok'}});
        //expect(payload.meta).to.include('test', 'id');
        //expect(payload.meta.test).to.equal(true);
        //done();
        //});
        //});

        //lab.test('missing', function (done) {

        //var options = {
        //method: 'GET', url: '/ok'
        //};
        //server.inject(options, function (response) {

        //expect(response.statusCode).to.equal(400);
        //done();
        //});
        //});

        //lab.test('invalid', function (done) {

        //var options = {
        //method: 'GET', url: '/',
        //headers: {
        //accept: 'application/example'
        //}
        //};
        //server.inject(options, function (response) {

        //errorCheck(response, 400, 'Invalid `Accept` header');
        //done();
        //});
        //});

        //lab.test('wrong type', function (done) {

        //var options = {
        //method: 'GET', url: '/',
        //headers: {
        //accept: 'text/json'
        //}
        //};
        //server.inject(options, function (response) {

        //errorCheck(response, 400, 'Invalid `Accept` header');
        //done();
        //});
        //});

        //lab.test('application/json', function (done) {

        //var options = {
        //method: 'GET', url: '/ok',
        //headers: {
        //accept: 'application/json'
        //}
        //};
        //server.inject(options, function (response) {

        //var payload = JSON.parse(response.payload);
        //expect(response.statusCode).to.equal(200);
        //expect(payload).to.include({data: {id: 'ok'}});
        //expect(payload.meta).to.include('test', 'id');
        //expect(payload.meta.test).to.equal(true);
        //done();
        //});
        //});
        //lab.test('application/json, text/javascript', function (done) {

        //var options = {
        //method: 'GET', url: '/ok',
        //headers: {
        //accept: 'application/json, text/javascript'
        //}
        //};
        //server.inject(options, function (response) {

        //var payload = JSON.parse(response.payload);
        //expect(response.statusCode).to.equal(200);
        //expect(payload).to.include({data: {id: 'ok'}});
        //expect(payload.meta).to.include('test', 'id');
        //expect(payload.meta.test).to.equal(true);
        //done();
        //});
        //});


        //lab.test('wrong format', function (done) {

        //var options = {
        //method: 'GET', url: '/',
        //headers: {
        //accept: 'application/vnd.api+xml'
        //}
        //};
        //server.inject(options, function (response) {

        //errorCheck(response, 400, 'Invalid `Accept` header');
        //done();
        //});

        //});

        //lab.test('media type', function (done) {

        //var options = {
        //method: 'GET', url: '/',
        //headers: {
        //accept: 'application/vnd.api+json;q=0.9'
        //}
        //};
        //server.inject(options, function (response) {

        //errorCheck(response, 406, 'Media type parameters not allowed');
        //done();
        //});
        //});
        //});

        lab.experiment('Content-Type', () => {

            lab.test('valid', (done) => {

                const options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json'
                    }
                };
                server.inject(options, (response) => {

                    const payload = JSON.parse(response.payload);
                    expect(response.statusCode).to.equal(200);
                    expect(payload).to.part.include({ data: { id: 'post' } });
                    done();
                });
            });

            lab.test('missing', (done) => {

                const options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': ''
                    }
                };
                server.inject(options, (response) => {

                    errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
                    done();
                });
            });

            lab.test('wrong type', (done) => {

                const options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'text/json'
                    }
                };
                server.inject(options, (response) => {

                    errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
                    done();
                });
            });

            lab.test('wrong subtype', (done) => {

                const options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/json'
                    }
                };
                server.inject(options, (response) => {

                    errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
                    done();
                });
            });

            lab.test('media type', (done) => {

                const options = {
                    method: 'POST', url: '/post',
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json;q=0.9'
                    }
                };
                server.inject(options, (response) => {

                    errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
                    done();
                });
            });

            // https://github.com/json-api/json-api/issues/837
            lab.test('media type is charset=utf-8', (done) => {

                const options = {
                    method: 'POST', url: '/post',
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json; charset=UTF-8'
                    }
                };
                server.inject(options, (response) => {

                    const payload = JSON.parse(response.payload);
                    expect(response.statusCode).to.equal(200);
                    expect(payload).to.part.include({ data: { id: 'post' } });
                    done();
                });
            });
        });

        lab.experiment('Boom replies', () => {

            lab.test('notfound', (done) => {

                const options = {
                    method: 'GET', url: '/missing',
                    headers: {
                        accept: 'application/vnd.api+json'
                    }
                };
                server.inject(options, (response) => {

                    errorCheck(response, 404);
                    const payload = JSON.parse(response.payload);
                    expect(payload.meta.test).to.equal(true);
                    done();
                });

            });

            lab.test('unauthorized', (done) => {

                const options = {
                    method: 'GET', url: '/auth',
                    headers: {
                        accept: 'application/vnd.api+json'
                    }
                };
                server.inject(options, (response) => {

                    errorCheck(response, 401, 'need auth');
                    done();
                });

            });
        });

        lab.test('empty reply', (done) => {

            const options = {
                method: 'DELETE', url: '/delete',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, (response) => {

                expect(response.statusCode).to.equal(204);
                expect(response.payload).to.equal('');
                done();
            });
        });

        lab.test('options', (done) => {

            const options = {
                method: 'OPTIONS', url: '/ok',
                headers: {
                    Origin: 'http://localhost',
                    'Access-Control-Request-Method': 'GET'
                }
            };
            server.inject(options, (response) => {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });

    });

    lab.experiment('without meta', () => {

        const server = new Hapi.Server();
        server.connection();

        const plugins = [{
            register: require('../'),
            options: {}
        }];


        lab.before((done) => {

            serverSetup(server);
            server.register(plugins, (err) => {

                Hoek.assert(!err, 'Failed loading plugins: ' + err);

                server.start((err) => {

                    Hoek.assert(!err, 'Failed starting server: ' + err);

                    return done();
                });
            });
        });

        lab.test('valid response', (done) => {

            const options = {
                method: 'GET', url: '/ok',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, (response) => {

                const payload = JSON.parse(response.payload);
                expect(response.statusCode).to.equal(200);
                expect(payload).to.part.include({ data: { id: 'ok' } });
                expect(payload.meta).to.include('id');
                expect(response.headers['content-type']).to.equal('application/vnd.api+json');
                done();
            });
        });

        lab.test('boom response', (done) => {

            const options = {
                method: 'GET', url: '/missing',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            server.inject(options, (response) => {

                errorCheck(response, 404);
                done();
            });
        });

        lab.test('without accept header', (done) => {

            const options = {
                method: 'GET', url: '/text',
                headers: {}
            };
            server.inject(options, (response) => {

                const payload = response.payload;
                expect(response.statusCode).to.equal(200);
                expect(response.headers['content-type']).to.equal('text/plain; charset=utf-8');
                expect(payload).to.equal('ok');
                done();
            });
        });

        lab.test('with accept: text/plain header', (done) => {

            const options = {
                method: 'GET', url: '/text',
                headers: {
                    accept: 'text/plain'
                }
            };
            server.inject(options, (response) => {

                const payload = response.payload;
                expect(response.statusCode).to.equal(200);
                expect(payload).to.equal('ok');
                done();
            });
        });

    });
});
