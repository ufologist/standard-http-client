var express = require('express');

console.log();

var app = express();
var port = process.argv[2] || 8000;

app.all('/api', function (request, response) {
    var status = request.query.status ? parseInt(request.query.status) : 0;
    var message = request.query.message ? request.query.message : '';

    response.jsonp({
        status: status,
        data: 'data',
        statusInfo: {
            message: message,
            detail: ''
        }
    });
});

app.get('/api-response-not-standard', function (request, response) {
    response.send('');
});

app.listen(port, function() {
    console.log(`Mock server starting on port ${port}!`);
});