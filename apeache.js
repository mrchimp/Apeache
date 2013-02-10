var http = require('http'),
    fs = require('fs'),
    url = require('url'),
    qs = require('querystring'),
    path = require('path'),
    util = require('util');

var Apeache = function () {};

Apeache.visitor_count = 0;

Apeache.start = function () {
    this.server = http.createServer(this.respond).listen(1337);
    console.log('Apeache Server running on port 1337');
};

Apeache.returnFile = function (res, filePath) {
    var stat = fs.statSync(filePath);
        
    res.writeHead(200, {
        'Content-Type': 'image/x-icon',
        'Content-Length': stat.size
    });
    
    var readStream = fs.createReadStream(filePath);
    util.pump(readStream, res);
};

Apeache.respond = function (req, res) {
    if (req.url === '/favicon.ico') {
        var filePath = path.join(__dirname, 'favicon.ico');
        Apeache.returnFile(res, filePath)
    } else if (req.url === '/') {
        req.on('end', function () {
            Apeache.visitor_count += 1;
            console.log('Visitor #' + Apeache.visitor_count + ': ' + req.connection.remoteAddress);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('<!DOCTYPE html><head><title>Apeache</title></head><body>');
            res.write('<p><strong>Someone said:</strong> ' + Apeache.escapeHtml(fs.readFileSync('data.txt', 'utf-8')) + '</p>');
            res.write(fs.readFileSync('form.html', 'utf-8'));
            res.write('<p>' + Apeache.visitor_count + ' visitors since last reboot.</p>');
            res.write('<p><a href="/">Refresh</a></p>');
            res.end('</body></html>');
        });
    } else if (req.url === '/post') {
        if (req.method !== 'POST') {
            res.writeHead(302, {
                'Location': '/'
            });
            res.end();
        }
        
        var body = '';
        req.on('data', function (chunk) {
            body += chunk;
        });

        req.on('end', function () {
            var POST = qs.parse(body);
            Apeache.visitor_count += 1;
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('<!DOCTYPE html><head><title>Apeache</title></head><body>');
            fs.writeFile('data.txt', POST.usertext, function (err) {
                if (err) { console.log(err); }
                res.write('<p><strong>You said:</strong> ' + Apeache.escapeHtml(fs.readFileSync('data.txt', 'utf-8')) + '</p>');
                res.write(fs.readFileSync('form.html', 'utf-8'));
                res.write('<p>' + Apeache.visitor_count + ' visitors since last reboot.</p>');
                res.write('<p><a href="/">Refresh</a></p>');
                res.end('</body></html>');
            });
        });
    } else {
        Apeache.throwError(res, 404, 'Could not find file: ' + req.url);
        return false;
    }
};

Apeache.throwError = function (res, error_code, message) {
    res.writeHead(error_code, {'Content-Type': 'text/html'});
    fs.readFile('errors/' + error_code + '.html', 'utf-8', function (error, data) {
        res.end(data);
    });
};

Apeache.escapeHtml = function (unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

Apeache.start();
