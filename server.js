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
var socketHost = {}
var room;

// Establish connection with client
io.on('connection', function (socket) {
    // send the name from the index page
    socket.emit('hostName', {host: socketHost});
    socket.on('room', (room) => {
        // Socket will join room.
        socket.join(room);
        room = room
    })
})
io.sockets.in(room).emit('message', 'hay yallllllllllllll');

/*  ---------- View Engine ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// ---------- Static Views ----------
app.use(express.static(__dirname + '/static'));


// 'Start new game' form is submitted
app.post('/new-game', (req, res) => {
    // get username and save in session
    console.log('NEW GAME, REQ.BODY.hostName: ', req.body.hostName);
    req.session.hostName = req.body.hostName;

    // generate a random code for a new game
    var gameCode = '';
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 6; i++) {
        gameCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // custom path for each game
    res.redirect('/game/' + gameCode);
});

app.get('/game/:gameCode', (req, res) => {
    socketHost = req.session.hostName;
    res.render('game', {
        name: req.session.hostName
    });
});

// Landing
app.get('/', (req, res) => {
    res.send('index.html');
});