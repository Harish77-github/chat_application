const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

let socketsConnected = new Set();
const userNames = new Map(); // socket.id -> username

const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

const io = require('socket.io')(server);

io.on('connection', socket => {
    console.log(socket.id);
    socketsConnected.add(socket.id);
    io.emit('clients-total', socketsConnected.size);

    socket.on('message', (data) => {
        console.log('Message received:', data);
        socket.broadcast.emit('chat-message', data);
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });

    socket.on('new-user', (data) => {
        const username = data?.name || "anonymous";
        userNames.set(socket.id, username); 
        socket.broadcast.emit('user-joined', { name: username });
    });

    socket.on('name-change', (data) => {
        const oldName = userNames.get(socket.id) || "anonymous";
        const newName = data?.name || "anonymous";
        userNames.set(socket.id, newName);
        socket.broadcast.emit('user-renamed', { oldName, newName });
    });

    socket.on("disconnect", () => {
        const username = userNames.get(socket.id) || "anonymous";
        socket.broadcast.emit('user-left', { name: username }); 
        console.log(`Socket with id ${socket.id} disconnected`);
        userNames.delete(socket.id); 
        socketsConnected.delete(socket.id);
        io.emit('clients-total', socketsConnected.size);
    });
});