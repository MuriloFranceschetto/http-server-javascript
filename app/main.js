const net = require("net");

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
        server.close();
    });
    socket.on("data", (data) => {
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
        socket.end();
    });
});

server.listen(4221, "localhost");
console.log("Server listening on port 4221")
