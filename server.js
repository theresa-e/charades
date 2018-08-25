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

/* ---------- socket.io ---------- */
const io = require('socket.io')(server);
var host = {}
var room;
io.on('connection', function (socket) {
    socket.on('host', (data) => {
        host = data;
        socket.emit('host-name', host)
    });
    socket.on('room', (room) => {
        // Socket will join room.
        socket.join(room);
        room = room
        console.log('@@@@@@@@@@@@@@@@@@: ', room);
    })
})

io.sockets.in(room).emit('message', 'hay yallllllllllllll');
/*  ---------- View Engine ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// ---------- Static Views ----------
app.use(express.static(__dirname + '/static'));

// Start new game form is submitted.
app.post('/new-game', (req, res) => {
    // get username
    console.log(req.body);

    // generate a random code for their game
    var gameCode = '';
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i=0; i<6; i++) {
        gameCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    res.redirect('/game/' + gameCode);
});

app.get('/game/:code', (req, res) => {
    console.log('REQ.BODY: ', req.body)
    console.log('The game code: ', req.params.code);
    res.render('game');
});

// Land ing page
app.get('/', (req, res) => {
    res.send('index.html');
});