var express = require('express');

console.log();

var app = express();
var port = process.argv[2] || 8000;

app.all('/api', function (request, response) {
    var status = request.query.status ? parseInt(request.query.status) : 0;
    var message = request.query.message ? request.query.message : '';
    var onlyMessage = request.query.onlyMessage ? request.query.onlyMessage : '';

    var result = {
        status: status,
        data: 'data'
    };

    if (message) {
        result.statusInfo = {
            message: message,
            detail: ''
        };
    } else if (onlyMessage) {
        result.message = onlyMessage;
    }

    response.jsonp(result);
});

app.get('/api-response-empty', function (request, response) {
    response.send('');
});

app.get('/api-response-not-standard', function (request, response) {
    var code = request.query.code ? parseInt(request.query.code) : 0;
    var message = request.query.message ? request.query.message : '';

    response.jsonp({
        code: code,
        res: 'data',
        message: message
    });
});

app.get('/api-response-bigint', function (request, response) {
    response.send(`{
        "status": 0,
        "data": {
            "id": 9223372036854775807
        }
    }`)
});

app.listen(port, function() {
    console.log(`Mock server starting on port ${port}!`);
});