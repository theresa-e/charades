var path = require("path")

// ---------- Express ---------- 
const express = require('express');
const app = express();
const server = app.listen(7000, function () {
    var host = server.address().address;
    var port = server.address().port;
});
console.log("Running at port 7000...");

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

// ---------- socket.io ---------- 
const io = require('socket.io')(server);

// temp variables for scope
var tempUser;
var usernames = {};
var rooms = [];

io.sockets.on('connection', function (socket) {

    if (tempUser) {
        socket.nickname = tempUser.name // save name in socket connection
    }
    console.log('Socket successfully connected, id: ', socket.id);
    socket.on('room', function (room) {
        rooms.push(room);
        roomName = room;
        socket.join(roomName);
        socket.room = roomName;
        console.log('---- JOINING ROOM: ', roomName)
    });
});

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
app.get('/join', (req, res) => {
    console.log('------ Request to join game: ', req.body);
    req.session.isHost = false; // let user join as a player
    res.redirect('/game/' + req.body.gameCode);
});

// Route for game page
app.get('/game/:roomCode', (req, res) => {
    var userInfo = req.session.isHost; // user joins as a HOST!
    res.render('game', {
        userInfo: userInfo,
        roomCode: req.params.roomCode
    });
});

// Landing page
app.get('/', (req, res) => {
    res.send('index.html');
});