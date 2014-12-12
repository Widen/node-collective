'use strict';

//process.env.DEBUG = 'collective';

var test = require('tape');

var collective = require('../index');


var options = {
    auth: {
        type: 'basic',
        username: '0e62d36908e2166d541ff73da066a4a2b115d973.app.widen.com',
        password: '1e72ddf22ef38387fa24df1d1a9831fadb6abeb7'
    },
    headers: {
        'foo': 'bar',
        'herp': 'derp'
    }
};
options.protocol = 'http';
options.host = 'private-17b4-widen.apiary-mock.com';
options.port = '80';

test('Promise API', function(t){

    t.plan(2);

    var handle_success = function() {
        t.pass('Success handled');
    };

    var handle_error = function(err) {
        t.ok(err, 'Error is okay here.');
    };

    //var fail = function(e) {
    //    t.fail('Promise API spec not respected');
    //};

    var noop = function(){};

    var query = null;

    collective('GET', '/user/address', query, options)
        .then(handle_success, noop);

    collective('GET', '/foo/bar', query, options)
        .then(noop, handle_error);

});

test('Works with callbacks', function(t){

    t.plan(2);

    var handle_success = function(err, res) {
        t.ok(!err, 'Success handled');
    };

    var handle_error = function(err, res) {
        t.ok(err, 'Error is okay here.');
    };

    var query = null;
    collective('GET', '/user/address', query, options, handle_success);
    collective('GET', '/foo/bar', query, options, handle_error);

});

test('Errors', function(t){
    t.plan(6);

    var query = {
        uuid: 'foobar',
    };

    collective('GET', '/woot/:uuid', query, options, function(err, res){
        if (err) {
            t.assert(err.statusCode >= 0,
                     'Error object property statusCode');
            t.assert(err.name && err.name.length > 0,
                     'Error object property name');
            t.assert(err.path && err.path.length > 0,
                     'Error object property path');
            t.assert(err.method && err.method.length > 0,
                     'Error object property method');
            t.assert(err.res && err.res.statusCode >= 0,
                     'Error object property res (response)');
            t.assert(err instanceof Error ,
                     'Error object is an instance of an Error');
        }
        else {
            t.fail('Need an error');
        }
    });

});

test('URL path interpolation', function(t){

    t.plan(1);

    var query = {
        uuid: 'a5a70b88-312d-4f0d-99ae-264c05325fdd',
    };

    collective('GET', '/category/uuid/:uuid/subcategories', query, options,
        function(err, res){
            t.ok(res.req.path.indexOf(query.uuid) !== -1,
                'Single parameter successful');
    });

});

test('Query added to URL query string', function(t){

    t.plan(1);

    var query = {
        count: '3',
        offset: '1'
    };

    collective('GET', '/user/address', query, options, function(err, res){
        t.pass('Success');
    });

});

test.skip('Returns a Buffer', function(t){

    t.plan(2);

    var query = {
        uuid: 'a5a70b88-312d-4f0d-99ae-264c05325fdd',
        count: '1'
    };

    collective.buffer('GET', '/category/uuid/:uuid/subcategories',
                      query,
                      options,
                      function(err, res){
                        t.ok(Buffer.isBuffer(res.body),
                             'Buffer returned successfully');
    });

    collective.buffer('GET', '/category/uuid/:uuid/subcategories',
                      query, options)
        .then(function(res){
            t.ok(Buffer.isBuffer(res.body), 'Buffer returned successfully');
    });

});


test.skip('Returns JSON', function(t){

    t.plan(2);

    var query = {
        uuid: 'a5a70b88-312d-4f0d-99ae-264c05325fdd',
    };

    collective.json('GET', '/category/uuid/:uuid/subcategories',
                    query,
                    options,
                    function(err, res){
                        var json = JSON.stringify(res.body);
                        t.ok(json, 'JSON data returned successfully');
    });

    collective.json('GET', '/category/uuid/:uuid/subcategories',
                    query,
                    options)
        .then(function(res){
            var json = JSON.stringify(res.body);
            t.ok(json, 'JSON data returned successfully');
    });

});

test('POST request', function(t) {
    t.plan(1);

    var query = {
        'fields': {
            'firstName': {
                'value': 'Jane'
            },
            'lastName': {
                'value': 'Doe'
            },
            'email': {
                'value': 'jane@somedomain.com'
            },
            'company': {
                'value': 'Some Company'
            },
            'streetAddress': {
                'value': '1234 Main St'
            },
            'city': {
                'value': 'Waunakee'
            },
            'stateOrProvince': {
                'value': 'WI'
            },
            'postalCode': {
                'value': '53597'
            },
            'country': {
                'value': 'United States'
            },
            'phone': {
                'value': '608-555-5556'
            }
        }
    };
    collective('POST', '/address/saved', query, options)
    .then(function(){
        t.pass('POST request success');
    });
});

test('PUT request', function(t) {
    t.plan(1);

    var query = {
        'uuid': 'efad1d0d-fadf-4a2a-97b7-4f6d453c2d93',
        'fields': {
            'firstName': {
                'value': 'Jane'
            },
            'lastName': {
                'value': 'Doe'
            },
            'email': {
                'value': 'jane@somedomain.com'
            },
            'company': {
                'value': 'Some Company'
            },
            'streetAddress': {
                'value': '1234 Main St'
            },
            'city': {
                'value': 'Waunakee'
            },
            'stateOrProvince': {
                'value': 'WI'
            },
            'postalCode': {
                'value': '53597'
            },
            'country': {
                'value': 'United States'
            },
            'phone': {
                'value': '608-555-5556'
            }
        }
    };
    collective('PUT', '/address/saved/uuid/:uuid', query, options)
    .then(function(){
        t.pass('PUT request success');
    });
});

test('DELETE request', function(t) {
    t.plan(1);

    var query = {
        uuid: 'efad1d0d-fadf-4a2a-97b7-4f6d453c2d93'
    };
    collective('DELETE', '/address/saved/uuid/:uuid', query, options)
    .then(function(){
        t.pass('DELETE request success');
    });
});

test('Uses default options', function(t) {
    t.plan(1);
    var query = {
        uuid: 'efad1d0d-fadf-4a2a-97b7-4f6d453c2d93'
    };
    collective('GET', '/address/saved/uuid/:uuid', query)
    .then(function(){
    }).catch(function(){
        t.pass('Error is okay here. Using default options');
    });
});

test('OAuth Authentication token', function(t) {
    t.plan(1);

    var oauth_options = {
        protocol: 'http',
        host: 'private-17b4-widen.apiary-mock.com',
        port: '80',
        auth: {
            type: 'oauth',
            token: 'foobar'
        }
    };

    var query = {
        uuid: 'efad1d0d-fadf-4a2a-97b7-4f6d453c2d93',
    };

    collective('GET', '/address/saved/uuid/:uuid', query, oauth_options)
    .then(function(){
        t.pass('Works with OAuth');
    });
});

test('Bearer token Authentication token', function(t) {
    t.plan(1);

    var bearer_options = {
        protocol: 'http',
        host: 'private-17b4-widen.apiary-mock.com',
        port: '80',
        auth: {
            type: 'bearer',
            bearer: '2eca64f9d1f246a7f8de13e4f39cd9'
        }
    };

    var query = {
        uuid: 'efad1d0d-fadf-4a2a-97b7-4f6d453c2d93',
    };

    collective('GET', '/address/saved/uuid/:uuid', query, bearer_options)
    .then(function(){
        t.pass('Works with Bearer token');
    });
});

test('Throws error on unrecognized auth type', function(t) {
    t.plan(1);

    var error_options = {
        protocol: 'http',
        host: 'private-17b4-widen.apiary-mock.com',
        port: '80',
        auth: {
            type: 'derp',
            token: 'foobar'
        }
    };

    var query = {
        uuid: 'efad1d0d-fadf-4a2a-97b7-4f6d453c2d93',
    };

    collective('GET', '/address/saved/uuid/:uuid', query, error_options)
    .then(function(){})
    .catch(function(){
        t.pass('Error thrown for unrecognized auth type');
    });

});

test('setTimeout', function(t) {
    t.plan(1);

    var query = {
        uuid: 'efad1d0d-fadf-4a2a-97b7-4f6d453c2d93',
    };

    var new_options = options;
    new_options.timeout = 1;

    collective('GET', '/address/saved/uuid/:uuid', query, new_options)
    .then(function(){
        t.pass('Timeout applied');
    });

});

