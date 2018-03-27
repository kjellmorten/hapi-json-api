'use strict';

const Boom = require('boom');
const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const errorCheck = function (response, code, detail) {

    const payload = JSON.parse(response.payload);
    Code.expect(payload).to.include('errors');
    Code.expect(payload.errors).to.have.length(1);
    Code.expect(payload.meta).to.include('id');
    if (detail) {
        Code.expect(payload.errors[0].detail).to.include(detail);
    }
};

const serverSetup = function (server) {

    server.route({ method: 'GET', path: '/ok', handler: () => ({ data: { id: 'ok', type: 'response' } }) });
    server.route({ method: 'POST', path: '/post', handler: () => ({ data: { id: 'post', type: 'response' } }) });
    server.route({ method: 'GET', path: '/auth', handler: () => Boom.unauthorized('need auth') });
    server.route({ method: 'DELETE', path: '/delete', handler: (request, respToolkit) => respToolkit.response().code(204) });
    server.route({ method: 'GET', path: '/text', handler: (request, respToolkit) => respToolkit.response('ok').code(200).header('Content-Type', 'text/plain') });
};


lab.experiment('hapi-json-api', () => {

    lab.experiment('with meta', () => {

        const server = Hapi.server({ routes: { cors: true } });

        const plugins = [{
            plugin: require('../'),
            options: { meta: { test: true } }
        }];


        lab.before(async () => {

            serverSetup(server);
            await server.register(plugins);
        });

        lab.experiment('Content-Type', () => {

            lab.test('valid', async () => {

                const options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json'
                    }
                };
                const response = await server.inject(options);
                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload).to.part.include({ data: { id: 'post' } });
            });

            lab.test('missing', async () => {

                const options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': ''
                    }
                };
                const response = await server.inject(options);
                errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
            });

            lab.test('wrong type', async () => {

                const options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'text/json'
                    }
                };
                const response = await server.inject(options);
                errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
            });

            lab.test('wrong subtype', async () => {

                const options = {
                    method: 'POST', url: '/post',
                    payload: { data: { type: 'post', attributes: { name: 'test' } } },
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/json'
                    }
                };
                const response = await server.inject(options);
                errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
            });

            lab.test('media type', async () => {

                const options = {
                    method: 'POST', url: '/post',
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json;q=0.9'
                    }
                };
                const response = await server.inject(options);
                errorCheck(response, 415, 'Only `application/vnd.api+json` content-type supported');
            });

            // https://github.com/json-api/json-api/issues/837
            lab.test('media type is charset=utf-8', async () => {

                const options = {
                    method: 'POST', url: '/post',
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json; charset=UTF-8'
                    }
                };
                const response = await server.inject(options);
                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload).to.part.include({ data: { id: 'post' } });
            });
        });

        lab.experiment('Boom replies', () => {

            lab.test('notfound', async () => {

                const options = {
                    method: 'GET', url: '/missing',
                    headers: {
                        accept: 'application/vnd.api+json'
                    }
                };
                const response = await server.inject(options);
                errorCheck(response, 404);
                const payload = JSON.parse(response.payload);
                Code.expect(payload.meta.test).to.equal(true);
            });

            lab.test('unauthorized', async () => {

                const options = {
                    method: 'GET', url: '/auth',
                    headers: {
                        accept: 'application/vnd.api+json'
                    }
                };
                const response = await server.inject(options);
                errorCheck(response, 401, 'need auth');
            });
        });

        lab.test('empty reply', async () => {

            const options = {
                method: 'DELETE', url: '/delete',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            const response = await server.inject(options);
            Code.expect(response.statusCode).to.equal(204);
            Code.expect(response.payload).to.equal('');
        });

        lab.test('options', async () => {

            const options = {
                method: 'OPTIONS', url: '/ok',
                headers: {
                    Origin: 'http://localhost',
                    'Access-Control-Request-Method': 'GET'
                }
            };
            const response = await server.inject(options);
            Code.expect(response.statusCode).to.equal(200);
        });

    });

    lab.experiment('without meta', () => {

        const server = Hapi.server();

        const plugins = [{
            plugin: require('../'),
            options: {}
        }];


        lab.before(async () => {

            serverSetup(server);
            await server.register(plugins);
        });

        lab.test('valid response', async () => {

            const options = {
                method: 'GET', url: '/ok',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            const response = await server.inject(options);
            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload).to.part.include({ data: { id: 'ok' } });
            Code.expect(payload.meta).to.include('id');
            Code.expect(response.headers['content-type']).to.equal('application/vnd.api+json');
        });

        lab.test('boom response', async () => {

            const options = {
                method: 'GET', url: '/missing',
                headers: {
                    accept: 'application/vnd.api+json'
                }
            };
            const response = await server.inject(options);
            errorCheck(response, 404);
        });

        lab.test('without accept header', async () => {

            const options = {
                method: 'GET', url: '/text',
                headers: {}
            };
            const response = await server.inject(options);
            const payload = response.payload;
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.headers['content-type']).to.equal('text/plain; charset=utf-8');
            Code.expect(payload).to.equal('ok');
        });

        lab.test('with accept: text/plain header', async () => {

            const options = {
                method: 'GET', url: '/text',
                headers: {
                    accept: 'text/plain'
                }
            };
            const response = await server.inject(options);
            const payload = response.payload;
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload).to.equal('ok');
        });

    });
});
