var path = require("path")

/* ---------- Express ---------- */
const express = require('express');
const app = express();
const server = app.listen(7000, function () {
    var host = server.address().address;
    var port = server.address().port;
});
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

        if (user) {
            if (user.isHost){
                console.log('--- New game has started: ', user);
            } else {
                console.log('--- Someone joined a game: ', user)
            }
        }
        
        socket.on('message', (res) => {
            console.log('new message received from server :', res)
            allMsgs.push(res.message);
            io.sockets.in(roomName).emit('new-message-added', {
                message: res.message
            })
        });

        socket.on('video', (res) => {
            console.log('RES----: ', res)
        })
    });
});


/*  ---------- View Engine ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// ---------- Static Views ----------
app.use(express.static(__dirname + '/static'));


// 'Start new game' form is submitted
app.post('/new', (req, res) => {
    if (req.body.hostName) {
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
    } else {
        req.flash('newgameMessage', 'You must enter a name to start a new game.');
        res.redirect(301, '/');
    }
});

// 'Join existing game' form is submitted
app.post('/join', (req, res) => {
    console.log('------ Request to join game: ', req.body);
    tempUser = req.body.user
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