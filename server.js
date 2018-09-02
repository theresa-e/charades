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

// temp variables
var tempUser;
var allMsgs = [];
io.sockets.on('connection', function (socket) {
    var roomName;
    var user = tempUser
    socket.on('room', function (room) {
        roomName = room;
        socket.join(room);
        socket.emit('getAllMsgs', {
            allMsgs: allMsgs
        });
        socket.emit('roomInfo', {
            host: user,
        })
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
    // get username and save in session
    console.log('NEW GAME, REQ.BODY.hostName: ', req.body.hostName);

    // save name in socket variable to emit
    tempUser = {name: req.body.hostName, isHost: true};

    // generate a random code for a new game
    var gameCode = '';
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 6; i++) {
        gameCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // save gameCode in a variable to emit
    roomName = gameCode;

    // custom path for each game
    res.redirect('/game/' + gameCode);
});

app.post('/join', (req, res) => {
    console.log('USER WANTS TO JOIN THIS GAME: ', req.body);
    res.redirect('/game/'+req.body.gameCode)
});

// Route for game page
app.get('/game/:roomCode', (req, res) => {
    console.log(req.params.roomCode)
    res.render('game', {
        roomName: req.params.roomCode
    });
});

// Landing page
app.get('/', (req, res) => {
    res.send('index.html');
});