var path = require("path")

/* ---------- Express ---------- */
const express = require('express');
const app = express();
const server = app.listen(7000);
console.log("Running at port 7000...");

/* ---------- Body Parser ---------- */
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


/* ---------- socket.io ---------- */
const io = require('socket.io')(server);

// temp variables for scope
var tempUser;
io.sockets.on('connection', function (socket) {
    var allMsgs = [];
    var roomName;
    var user = tempUser

    socket.on('room', function (room) {
        console.log('room name: ', room)
        roomName = room;
        socket.join(room);

        // Get all existing messages in the room
        socket.emit('getAllMsgs', {
            allMsgs: allMsgs
        });

        // Send room info to user so they can send link to friends.
        socket.emit('roomInfo', {
            host: user,
        })

        // Add each new msg to the log (to send to new users).
        socket.on('message', (res) => {
            allMsgs.push(res.message);
            io.sockets.in(roomName).emit('new-message-added', {
                message: res.message
            })
        });
    });
});


/*  ---------- View Engine ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// ---------- Static Views ----------
app.use(express.static(__dirname + '/static'));


// 'Start new game' form is submitted
app.post('/new', (req, res) => {

    // generate a random code for a new game
    var gameCode = '';
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 6; i++) {
        gameCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // save gameCode and name to emit to client
    roomName = gameCode;
    tempUser = {
        name: req.body.hostName,
        isHost: true
    };

    // custom path for each game
    res.redirect('/game/' + gameCode);
});

// 'Join existing game' form is submitted
app.post('/join', (req, res) => {
    console.log('------ Request to join game: ', req.body);
    res.redirect('/game/' + req.body.gameCode);
});

// Route for game page
app.get('/game/:roomCode', (req, res) => {
    console.log(req.params.roomCode);
    res.render('game', {
        roomName: req.params.roomCode
    });
});

// Landing page
app.get('/', (req, res) => {
    res.send('index.html');
});