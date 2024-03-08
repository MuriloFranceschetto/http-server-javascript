const net = require("net");

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
        server.close();
    });
    socket.on("data", (data) => {
        const requestInfo = data.toString('utf8');
        const [, path] = requestInfo.trim().split(' ');
        if (path === '/') {
            socket.write("HTTP/1.1 200 OK\r\n\r\n");
        } else {
            socket.write("HTTP/1.1 401 Not Found\r\n\r\n");
        }
        socket.end();
        socket.destroy();
    });
});

server.listen(4221, "localhost");
console.log("Server listening on port 4221");
