const net = require("net");
const fs = require('fs');
const path = require('path');

let directory = '/';
let indexDirectoryArguments = process.argv.findIndex((el) => el === '--directory'); 
if (indexDirectoryArguments >= 0) {
    directory = process.argv[indexDirectoryArguments + 1];
}
console.log(`Configuration directory: ${directory}`);

const defaultPath = RegExp('^\/$');
const echoPath = RegExp('^\/echo\/(.+)$');
const filesPath = RegExp('^\/files\/(.+)$');
const userAgentPath = RegExp('^\/user-agent$');

const allowedPaths = [
    defaultPath, 
    echoPath,
    userAgentPath,
    filesPath,
];

function getInfoHeaders(request, matchRegex) {
    const match = request.match(matchRegex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
}

function addResponseFile(socket, fileContentBuffer) {
    socket.write("HTTP/1.1 200 OK\r\n");
    socket.write("Content-Type: application/octet-stream\r\n");
    socket.write(`Content-Length: ${fileContentBuffer.byteLength}\r\n\r\n${fileContentBuffer}`);
}

function addResponseTextBody(socket, content) {
    socket.write("HTTP/1.1 200 OK\r\n");
    socket.write("Content-Type: text/plain\r\n");
    socket.write(`Content-Length: ${Buffer.byteLength(content)}\r\n\r\n${content}`);
}

async function verifyFile(filePath) {
    let fullPath = path.join(directory, filePath);
    console.log(`Buscando arquivo: ${fullPath}`)
    if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
    }
    return null; 
} 

async function error404(socket) {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.end();
}

const server = net.createServer((socket) => {
    
    socket.on("close", () => {
        socket.end();
        server.close();
    });

    socket.on("data", async (data) => {

        const requestInfo = data.toString('utf8');
        const [method, path, httpVersion] = requestInfo.trim().split(' ');

        if (!allowedPaths.some(allowedPath => allowedPath.test(path))) {
            error404(socket);
            return;
        }

        const host = getInfoHeaders(requestInfo, /^Host: (.+)$/m);
        const userAgent = getInfoHeaders(requestInfo, /^User-Agent: (.+)$/m);

        const filesMatch = path.match(filesPath);
        if (filesMatch) {
            fileContent = await verifyFile(filesMatch[1]);
            if (!fileContent) {
                error404(socket);
                return;
            }
            addResponseFile(socket, fileContent);
        }

        socket.write("HTTP/1.1 200 OK\r\n");
            
        const echoMatch = path.match(echoPath);
        if (echoMatch) {
            const content = echoMatch[1];
            addResponseTextBody(socket, content);

        } else if (userAgentPath.test(path)) {
            addResponseTextBody(socket, userAgent);

        } else {
            socket.write("HTTP/1.1 200 OK\r\n");
            socket.write("\r\n");
        }

        socket.end();
    });

});
 
server.listen(4221, "localhost", () => console.log("Server listening on port 4221"));


