node-collective
===============

A JavaScript client for [Collective](http://widen.com). Works in node and in
the browser!

(Note: It technically works in the browser only if you turn off CORS or use a
proxy like [corsproxy](https://www.npmjs.org/package/corsproxy) to bypass
CORS restrictions for now.)

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](./LICENSE)[![Build
Status](http://img.shields.io/travis/Widen/node-collective.svg?style=flat-square)](https://travis-ci.org/Widen/node-collective)[![node-collective](http://img.shields.io/npm/v/media-collective.svg?style=flat-square)]()

[Documentation](http://widen.github.io/node-collective/)


# Response Handling

## Promises

Responses can be handled using promises thanks to [then/promise](https://github.com/then/promise).

```
// Promise
var success = function(res) {
    console.log("Promise success!");
};

var failure = function(err){
    console.log("Promise fail!");
}

var query = null;
collective('GET', '/collections', query, options).then(success, failure);
```

## Callbacks

Responses can also be handled using nodejs style callbacks:

```
// Callback
var cb = function(err, res){
    console.log("Callback success!");
};

var query = null;
collective('GET', '/collections', query, options, cb);
```

# Types of Results

The library can also return the response body in different ways. You can use
any of the following with callbacks or promises as well.

## Receive a [Stream](http://nodejs.org/api/stream.html#stream_class_stream_readable) of Data

By default, the `response` object passed into a successful promise or callback
is an instance of an [`http.IncomingMessage`](http://nodejs.org/api/http.html#http_http_incomingmessage) and, as such, the response body
is a
[`stream.Readable`](http://nodejs.org/api/stream.html#stream_class_stream_readable).

```
collective('GET', '/collections', null, options, cb);
```


## Receive a [Buffer](http://nodejs.org/api/buffer.html) of Data

You can also receive a Buffer of response data using the `buffer()` method.

```
collective.buffer('GET', '/collections', null, options, cb);
```

## Receive JSON Data

JSON data can be returned using the `json()` method:

```
// JSON Callback
var cb = function(err, res){
    console.log(res.body)
};

var query = null;
collective.json('GET', '/collections', query, options, cb);
```

```
// JSON Promise
var success = function(res) {
    console.log(res.body);
};

var query = null;
collective.json('GET', '/collections', query, options).then(success);
```

