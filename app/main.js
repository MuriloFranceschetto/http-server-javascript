const net = require("net");

const defaultPath = RegExp('^\/$');
const echoPath = RegExp('^\/echo\/.+$');

const allowedPaths = [
    defaultPath, 
    echoPath,
];

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
        server.close();
    });
    socket.on("data", (data) => {
        const requestInfo = data.toString('utf8');
        const [, path] = requestInfo.trim().split(' ');

        if (!allowedPaths.some(allowedPath => path.match(allowedPath))) {
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            socket.end();
            return;
        }

        socket.write("HTTP/1.1 200 OK\r\n");

        if (path.match(echoPath)) {
            socket.write("Content-Type: text/plain\r\n");
            const [,,content] = path.split('/');
            socket.write(`Content-Length: ${content.length}\r\n\r\n${content}`);
        }

        socket.end();
    });
});

server.listen(4221, "localhost");
console.log("Server listening on port 4221");
