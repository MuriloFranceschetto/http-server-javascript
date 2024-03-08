const net = require("net");
const fs = require('fs');
const path = require('path');

let directory = './';
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
    {allowedPath: defaultPath, allowedMethods: ['GET']}, 
    {allowedPath: echoPath, allowedMethods: ['GET']}, 
    {allowedPath: userAgentPath, allowedMethods: ['GET']}, 
    {allowedPath: filesPath, allowedMethods: ['GET', 'POST']},
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

function addResponseTextBody(socket, content, status = 200) {
    socket.write(`HTTP/1.1 ${status} OK\r\n`);
    socket.write("Content-Type: text/plain\r\n");
    socket.write(`Content-Length: ${Buffer.byteLength(content)}\r\n\r\n${content}`);
}

async function verifyFile(filePath) {
    let fullPath = path.join(directory, filePath);
    console.log(`Buscando arquivo: ${fullPath}`);
    if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
    }
    return null; 
}

async function writeFile(filePath, fileContent) {
    console.log(filePath, fileContent)
    let fullPath = path.join(directory, filePath);
    console.log(`Salvando arquivo: ${fullPath}`);
    fs.writeFileSync(filePath, fileContent)
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

        let pathConfig = allowedPaths.find(({allowedPath, allowedMethods}) => allowedPath.test(path) && allowedMethods.includes(method));
        if (!pathConfig) {
            error404(socket);
            return;
        }

        const host = getInfoHeaders(requestInfo, /^Host: (.+)$/m);
        const userAgent = getInfoHeaders(requestInfo, /^User-Agent: (.+)$/m);
        const bodyMessage = requestInfo.split('\r\n\r\n')[1];

        const filesMatch = path.match(filesPath);
        const echoMatch = path.match(echoPath);

        if (filesMatch) {
            if (method === 'GET') {
                fileContent = await verifyFile(filesMatch[1]);
                if (!fileContent) {
                    error404(socket);
                    return;
                }
                addResponseFile(socket, fileContent);
            }
            if (method === 'POST') {
                await writeFile(filesMatch[1], bodyMessage);
                addResponseTextBody(socket, '', 201);
            }

        } else if (echoMatch) {
            const content = echoMatch[1];
            addResponseTextBody(socket, content);

        } else if (userAgentPath.test(path)) {
            addResponseTextBody(socket, userAgent);

        } else {
            socket.write("HTTP/1.1 200 OK\r\n\r\n");
        }

        socket.end();
    });

});
 
server.listen(4221, "localhost", () => console.log("Server listening on port 4221"));


