const net = require("net");

const defaultPath = RegExp('^\/$');
const echoPath = RegExp('^\/echo\/(.+)$'); // Changed regex to capture the entire path after echo/
const userAgentPath = RegExp('^\/user-agent$');

const allowedPaths = [
    defaultPath, 
    echoPath,
    userAgentPath,
];

function getInfoHeaders(request, matchRegex) {
    const match = request.match(matchRegex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
}

function addResponseBody(socket, content) {
    socket.write("Content-Type: text/plain\r\n");
    socket.write(`Content-Length: ${Buffer.byteLength(content)}\r\n\r\n${content}`); // Use Buffer.byteLength to get correct content length
}

const server = net.createServer((socket) => {
    
    socket.on("close", () => {
        socket.end();
        server.close();
    });

    socket.on("data", (data) => {

        const requestInfo = data.toString('utf8');
        const [method, path, httpVersion] = requestInfo.trim().split(' ');

        if (!allowedPaths.some(allowedPath => allowedPath.test(path))) {
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            socket.end();
            return;
        }

        const host = getInfoHeaders(requestInfo, /^Host: (.+)$/m); // Use correct regular expression and multiline flag
        const userAgent = getInfoHeaders(requestInfo, /^User-Agent: (.+)$/m); // Use correct regular expression and multiline flag

        socket.write("HTTP/1.1 200 OK\r\n");

        const echoMatch = path.match(echoPath);
        if (echoMatch) {
            const content = echoMatch[1];
            addResponseBody(socket, content);

        } else if (userAgentPath.test(path)) {
            addResponseBody(socket, userAgent);

        } else {
            socket.write("\r\n");
        }

        socket.end();
    });

});
 
server.listen(4221, "localhost", () => console.log("Server listening on port 4221"));


