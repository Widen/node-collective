'use strict';

var http = require('http'),
    https = require('https'),
    qs = require('querystring'),
    url = require('url'),
    assert = require('assert');

var promise = require('promise'),
    console_stream = require('console-stream'),
    bole = require('bole'),
    pretty = require('bistre')(),
    FormData;

try {
    FormData = window.FormData;
} catch (e) {
    FormData = require('form-data');
}

var STATUS_CODES = http.STATUS_CODES,
    PROTOCOLS = { 'http': http, 'https': https },
    PORTS = { http: 80, https: 443 };

var logLevel = 'info';
if (process.env.NODE_ENV &&
    ('dev|debug').indexOf(process.env.NODE_ENV.toLowerCase() !== -1)) {
    logLevel = 'debug';
}
var log = bole('collective');
bole.output({ level: logLevel, stream: pretty });
pretty.pipe(console_stream());


/**
 * request
 *
 * Make a simple request to the Collective REST API.
 *
 * @param method    String      An HTTP method corresponding to the request
 *                              (can be GET, POST, PUT, PATCH, HEAD, or DELETE).
 * @param path      String      The path.
 * @param query     Object      Any query data. Will be sent as query string
 *                              for GET/DELETE/HEAD, or body for others.
 * @param options   Object      Any other request options. See node's HTTP
 *                              module.
 * @param callback  Function    An optional callback. If not provided, a
 *                              promise is returned instead.
 *
 * @return Promise
 */
var request = function request(method, path, query, options, callback){

    return new promise(function(resolve, reject) {
        options = JSON.parse(JSON.stringify(options || {}));

        var protocol = options.protocol || 'https',
            host = options.host || 'localhost',
            port = options.port || 8080;

        assert(['https', 'http'].indexOf(protocol) !== -1, 'Only http and ' +
               'https are supported.');

        method = method.toUpperCase();
        assert(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH']
               .indexOf(method) !== -1,
               'Only methods supported are GET, POST, PUT, DELETE, HEAD, ' +
               'and PATCH');

        assert(query === null || typeof query === 'object',
               'Query must be an object or null');

        // interpolate query with key/val pairs

        if (query && !(query instanceof FormData)) {
            try {
                query = JSON.parse(JSON.stringify(query));
            } catch (ex) {}
            path = path.replace(/\:([^\/\.]+)/g, function(_,p ){
            //path = path.replace(/\:\w+(?=\/?)/g, function(_, p){
                if (query[p]){
                    var ret = query[p];
                    delete query[p];
                    return ret;
                }
            });
        }

        var headers = {
            'user-agent': 'node-collective',
            'content-length': 0,
            'accept': 'application/json'
        };

        var hasBody = query !== null &&
            ('GET|DELETE|HEAD'.indexOf(method) === -1) ? true : false;

        var body;
        if (hasBody){
            log.debug('Detected request body data');
            if (query instanceof FormData) {
                body = query;
                headers['content-length'] = query.knownLength || 0;
                //headers['content-type'] = 'application/json; charset=utf-8';
            } else {
                body = JSON.stringify(query) + '\n';
                headers['content-length'] = Buffer.byteLength(body, 'utf-8');
                headers['content-type'] = 'application/json; charset=utf-8';
            }
        } else if (query !== null){
            log.debug('Detected URL query data');
            headers['content-type'] = 'text/plain; charset=utf-8';
            body = qs.stringify(query);
            if (body.length){
                path+='?'+body;
            }
        }

        if (options.auth) {
            log.debug('Detected auth');
            switch (options.auth.type) {
                case 'oauth':
                    log.debug('Detected oauth');
                    path += (path.indexOf('?') === -1 ? '?' : '&') +
                        'access_token=' +
                        encodeURIComponent(options.auth.token);
                    break;
                case 'basic':
                    log.debug('Detected basic auth');
                    headers.authorization = 'Basic ' + new Buffer(
                        options.auth.username +
                        ':' +
                        options.auth.password, 'ascii').toString('base64');
                    break;
                case 'bearer':
                    log.debug('Detected bearer token');
                    headers.Authorization = 'Bearer ' + options.auth.bearer;
                    break;
                default:
                    /* jshint -W027 */
                    throw new Error('Auth type of `' +
                                    options.auth.type + '` is not recognised.');
                    break;
            }
        }

        if (options.headers) {
            Object.keys(options.headers).forEach(function (key) {
                headers[key] = options.headers[key];
            });
        }

        var full_path = '/api/rest' + path;

        log.debug('Protocol: ' + protocol);
        log.debug('Host: ' + host);
        log.debug('Port: ' + port);
        log.debug('Headers:', headers);
        log.debug('Method: ' + method);
        log.debug('Path: ' + full_path);

        var req = PROTOCOLS[protocol].request({
            host: host,
            port: port,
            method: method,
            path: full_path,
            headers: headers,
            withCredentials: false
        });

        req.on('response', function(res){

            res.on('error', function(e) {
                log.error('Response error', e);
                reject(e);
            });

            log.debug('Response status: ' + res.statusCode);
            if ([301,302,307].indexOf(res.statusCode) !== -1) {
                log.debug('Recevied ' + res.statusCode + ' redirect');
                var location = url.parse(res.headers.location);
                options.protocol = location.protocol.substring(0,
                                            location.protocol.length - 1);
                options.host = location.host;
                var redirect_request = request(method, location.pathname, query,
                                  options);
                return resolve(redirect_request);
            }
            if (res.statusCode === 0 || res.statusCode >= 400) {
                var buf = [],
                    buffer;
                res.on('data', function(d) {
                    if (!Buffer.isBuffer(d)) {
                        d = new Buffer(d);
                    }
                    buf.push(d);
                });
                res.on('end', function(){
                    buffer = new Buffer.concat(buf);

                    var err = new Error();
                    try {
                        res.body = buffer.toString('utf-8');
                    } catch (exception) {
                    } finally {
                        var err_message = STATUS_CODES[res.statusCode] ||
                                          'UnknownHttpError';
                        err.name = err_message.replace(/ /g, '');
                        err.method = method;
                        err.path = path;
                        err.statusCode = (err.code = res.statusCode);
                        err.res = res;
                        log.debug(err);
                        reject(err);
                    }
                });
            }
            else {
                resolve(res);
            }
        });

        req.on('error', function(e){
            log.error('Request error', e);
            reject(e);
        });

        req.on('close', function(){
            log.debug('Request close');
        });

        if (hasBody){
            if (body.pipe && typeof body.pipe === 'function') {
                log.debug('Pipe-able body');
                body.pipe(req);
            }
            else if (body instanceof FormData) {
                log.debug('Request FormData body');
                req.end(body);
            } else {
                log.debug('Request send body');
                req.end(body);
            }
            log.debug('Request end');
        } else {
            req.end();
            log.debug('Request end');
        }

   }).nodeify(callback);

};

/**
 * buffer
 *
 * Same parameters as `request`. The response body will be a Buffer
 * containing the entire response.
 *
 * @return Promise  A Promise where the request body is a buffer
 */
var buffer = function buffer(method, path, query, options, callback){

    return request(method, path, query, options).then(function (res) {
        return new promise(function(resolve, reject){
            var buf = [],
                buffer;
            res.on('data', function(d) {
                log.debug('Data received', d);
                if (!Buffer.isBuffer(d)) {
                    d = new Buffer(d);
                }
                buf.push(d);
            });
            res.on('end', function(){
                log.debug('Buffer allocated');
                buffer = new Buffer.concat(buf);
                res.body = buffer;
                resolve(res);
            });
            res.on('error', function(e){
                log.error('Buffer allocation error', e);
                reject(e);
            });
        });
    }).nodeify(callback);
};

/**
 * json
 *
 * Same parameters as `request`. The response body will be a JSON object
 * containing the entire parsed response.
 *
 * @return Promise  A Promise where the request body is JSON.
 */
var json = function json(method, path, query, options, callback) {

    return buffer(method, path, query, options).then(function(res){
        if (res.body) {
            try {
                res.body = JSON.parse(res.body.toString('utf-8'));
            } catch (e) {
                res.body = res.body.toString('utf-8');
            }
        }
        return res;
    }).nodeify(callback);
};

exports = ( module.exports = request );
exports.json = json;
exports.buffer = buffer;
