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
// var gameInfo = {}; // set the host's name and the room number
// var players = {}; // players who join the game will go here!
// var chatLog = []; // all chat messages (for this game) will be here.

// Establish connection with client
// io.on('connection', function (socket) {
//     socket.join(gameInfo.gameCode);
//     // the name is set from the app.post method. 
//     socket.emit('gameInfo', {
//         game: gameInfo
//     });

//     io.to(gameInfo.gameCode).emit('hey room', {
//         msg: "ONLY TO THOSE IN THIS ROOM"
//     });

//     io.to(gameInfo.gameCode).emit('allMsgs', chatLog);


//     // each time a new user joins
//     socket.on('newUser', (res) => {
//         console.log('new user has joined the game')
//     });
//     socket.on('new-msg', (data) => {
//         console.log('data received', data)
//         chatLog.push(data);
//         io.to(gameInfo.gameCode).emit('latest-msg', {
//             data
//         });
//     })
//     // socket.on('room', (room) => {
//     //     // Socket will join room.
//     //     socket.join(room);
//     //     room = room
//     // })
// })
// io.sockets.in(room).emit('message', 'everyone');

// temp variable
var tempHost;
io.sockets.on('connection', function (socket) {
    var roomName;
    var hostName = tempHost;
    var allMsgs = ["hi", "hello", "bye"];



    socket.on('room', function (room) {
        console.log('client wants to join this room: ', room);
        roomName = room;
        socket.join(room);
        socket.emit('getAllMsgs', {
            allMsgs: allMsgs
        });
        console.log('@@@@@: ', hostName)
        socket.emit('roomInfo', {
            host: hostName,
        })
    });
    socket.on('message', (res) => {
        console.log('@@@@messages: ', res)
        allMsgs.push(res.message);
        console.log(allMsgs)
        io.sockets.in(roomName).emit('new-message-added', {
            message: res.message
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
    // get username and save in session
    console.log('NEW GAME, REQ.BODY.hostName: ', req.body.hostName);

    // save name in socket variable to emit
    tempHost = {name: req.body.hostName, isHost: true};

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
    console.log('USER WANTS TO JOIN A GAME: ', req.body);
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