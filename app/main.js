const net = require("net");

const defaultPath = RegExp('^\/$');
const echoPath = RegExp('^\/echo\/.+$');
const userAgentPath = RegExp('^\/user-agent$');

const allowedPaths = [
    defaultPath, 
    echoPath,
    userAgentPath,
];

function getHost(request) {
    const [matchHostInfo] = request.match(RegExp('Host: .+'));
    return matchHostInfo.split(': ')[1] || null;
}

function getUserAgent(request) {
    const [matchUserAgentInfo] = request.match(RegExp('User-Agent: .+'));
    return matchUserAgentInfo.split(': ')[1] || null;
}

function addResponseBody(socket, content) {
    socket.write("Content-Type: text/plain\r\n");
    socket.write(`Content-Length: ${content.length}\r\n\r\n${content}`);
}

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
        server.close();
    });
    socket.on("data", (data) => {
        const requestInfo = data.toString('utf8');
        const [method, path, httpVersion] = requestInfo.trim().split(' ');

        const host = getHost(requestInfo);
        const userAgent = getUserAgent(requestInfo);

        if (!allowedPaths.some(allowedPath => path.match(allowedPath))) {
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            socket.end();
            return;
        }

        socket.write("HTTP/1.1 200 OK\r\n");

        if (path.match(echoPath)) {
            const [,,content] = path.split('/');
            addResponseBody(socket, content);

        } else if (path.match(userAgentPath)) {
            addResponseBody(socket, userAgent);
        }
    });
});

server.listen(4221, "localhost", () => console.log("Server listening on port 4221"));
