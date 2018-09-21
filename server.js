var path = require("path")

// ---------- Express ---------- 
const express = require('express');
const app = express();
const server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
});
console.log("Running at port 3000...");

// ---------- Body Parser ---------- 
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// ---------- Session ----------
var session = require('express-session');
app.use(session({
    secret: 'SecretSessionCode',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 600000
    }
}))


// ---------- View Engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// ---------- Static Views ----------
app.use(express.static(__dirname + '/static'));

// 'Start new game' form is submitted
app.get('/new', (req, res) => {
    console.log('------ New game request!')
    // generate a random code for a new game
    var gameCode = '';
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 6; i++) {
        gameCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // save gameCode and name to emit to client
    roomName = gameCode;
    req.session.isHost = true;

    // custom path for each game
    res.redirect('/game/' + gameCode);
});

// 'Join existing game' form is submitted
app.post('/join', (req, res) => {
    console.log('------ Request to join game: ', req.body);
    req.session.isHost = false; // let user join as a player
    res.redirect('/game/' + req.body.gameCode);
});

// Route for game page
app.get('/game/:roomCode', (req, res) => {
    // isHost is determined by which path user went through
    var userInfo = req.session.isHost;
    res.render('game', {
        userInfo: userInfo,
        roomCode: req.params.roomCode
    });
});

// Landing page
app.get('/', (req, res) => {
    res.send('index.html');
});

// ---------- socket.io ---------- 
const io = require('socket.io')(server);

// temp variables for scope
var tempUser;
var allUsers = {};
var allRooms = {};
io.sockets.on('connection', function (socket) {
    console.log('Socket successfully connected, id: ', socket.id);

    socket.on('room', function (room) {
        // when the client enters the new room, we'll add the room name
        // to the rooms array.
        console.log(room.roomName)

        // check if the room exist. set structure.
        if (!allRooms[room.roomName]) {
            allRooms[room.roomName] = {
                host: {},
                players: []
            }
        }

        socket.room = room.roomName;
        socket.join(room.roomName);
        console.log('---- allRooms: ', allRooms)
        console.log('---- JOINING ROOM: ', room);
        console.log('---- socket.room: ', socket.room);
        socket.on('addUser', function (user) {
            // save the room name and client name to socket
            socket.username = user.name;
            console.log(allRooms)
            // if user is a host, set them as host.
            // else (they are a player), add them to player array.
            if (user.isHost === true) {
                allRooms[room.roomName].host = user;
            } else {
                allRooms[room.roomName].players.push({
                    name: user.name,
                    id: socket.id,
                    isHost: user.isHost
                });
                io.sockets.in(socket.room).emit('updateActiveUsers', {
                    allRooms: allRooms
                });
            }
            console.log('allrooms: ', allRooms)
            console.log('socket.username: ', socket.username);
            // send the full list to this sender-client
            socket.emit('getActiveUsers', {
                allRooms: allRooms
            })
            // everyone else only needs the new user
            socket.broadcast.to(room.roomName).emit('newUser', {
                newUser: user.name
            });
        });
        socket.on("newMsg", function (msg) {
            console.log('----- NEW MSG: ', msg);
            console.log('----- ROOM: ', room)
            io.sockets.in(room.roomName).emit('updateMsgs', {
                msg: msg
            });
        })
    });

    // when a client disconnects from a room, remove them from the 
    // active user list and 
    socket.on('disconnect', function () {
        console.log('--------- Client has disconnected from room: ', socket.room)
        for (var i = 0; i < allRooms[socket.room].players.length; i++) {
            if (allRooms[socket.room].players[i]['id'] === socket.id) {
                allRooms[socket.room].players.splice(i, 1);
                io.sockets.in(socket.room).emit('updateActiveUsers', {
                    allUsers: allUsers
                });
            }
        }
    })
});