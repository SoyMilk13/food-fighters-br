const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));

var players = {};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    // Connection
    console.log('A user connected');
    players[socket.id] = {
        rotation: 0,
        x: genRandomNum(0, 2560),
        y: genRandomNum(0, 2560),
        playerId: socket.id,
        team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
    };

    // Testing-- This code belongs under "Start Game"
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        delete players[socket.id];
        io.emit('playerDisconnect', socket.id);
    });

    /*
    // Start Game
    socket.on('startGame', () => {
        socket.emit('currentPlayers', players);
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });
    */

    // Player Movement
    socket.on('playerMovement', (movementData) => {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].rotation = movementData.rotation;
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });
});

server.listen(3000, () => {
    console.log(`Listening on port ${server.address().port}...`);
});

function genRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};