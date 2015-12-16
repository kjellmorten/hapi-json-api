var Boom = require('boom');
var Code = require('code');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Lab = require('lab');

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
                    //Code.expect(response.statusCode).to.equal(200);
                    //Code.expect(payload).to.deep.include({data: {id: 'ok'}});
                    //Code.expect(payload.meta).to.include('test', 'id');
                    //Code.expect(payload.meta.test).to.equal(true);
                    //done();
                //});
            //});

            //lab.test('missing', function (done) {

                //var options = {
                    //method: 'GET', url: '/ok'
                //};
                //server.inject(options, function (response) {

                    //Code.expect(response.statusCode).to.equal(400);
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
                    //Code.expect(response.statusCode).to.equal(200);
                    //Code.expect(payload).to.deep.include({data: {id: 'ok'}});
                    //Code.expect(payload.meta).to.include('test', 'id');
                    //Code.expect(payload.meta.test).to.equal(true);
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
                    //Code.expect(response.statusCode).to.equal(200);
                    //Code.expect(payload).to.deep.include({data: {id: 'ok'}});
                    //Code.expect(payload.meta).to.include('test', 'id');
                    //Code.expect(payload.meta.test).to.equal(true);
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
