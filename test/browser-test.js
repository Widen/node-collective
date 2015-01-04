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

require('./all-test.js');

test('Single File Upload', function(t){

    t.plan(1);

    var query = new FormData();
    query.append('uploadProfileUuid', '016546d6-8f38-4012-baeb-14805cef7393');
    query.append('filename', 'MyFile.png');
    query.append('file', new Blob(['the bytes'], {
        type: 'application/octet-stream'
    }));

    collective('POST', '/asset', query, options).then(function(res){
        t.pass('Success');
    }, function(err) {
        t.fail(err);
    });

});

test('Multi-File Upload', function(t){

    var files = [
        new Blob(['chunk 0'], { type: 'application/octet-stream' }),
        new Blob(['chunk 1'], { type: 'application/octet-stream' }),
        new Blob(['chunk 2'], { type: 'application/octet-stream' })
    ];

    t.plan(files.length);

    var totalParts = files.length;

    files.forEach(function(file, index){
        var query = new FormData();
        query.append('uploadProfileUuid',
                     '016546d6-8f38-4012-baeb-14805cef7393');
        query.append('qqpartindex', index);
        query.append('qqtotalparts', totalParts);
        query.append('filename', 'MyFile.txt');
        query.append('uuid', '26b5080a-5253-4d4d-b1ae-2a90a8b40c99');
        query.append('file', file);

        collective('POST', '/asset', query, options).then(function(res){
            t.pass('Chunk [' + index + '] uploaded successfully');
        }, function(err) {
            t.fail(err);
        });
    });

});
