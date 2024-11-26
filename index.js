const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const session = require('express-session');
const PORT = 3000;

const app = express();
let currentUser;
// Create an HTTP server
const server = http.createServer(app);

// Initialize socket.io
const io = socketIO(server);

// Admin credentials for login
const adminCredentials = [
    { username: "Raghav", password: "Raghav@1608" },
    { username: "Pranay", password: "bhaiyaji" },
    { username: "Vansh", password: "HandsomeGuy" }
];

// Set up session middleware
app.use(session({
    secret: 'your_secret_key',   // Secret key for signing session ID cookies
    resave: false,               // Do not resave session if it wasn't modified
    saveUninitialized: false,    // Do not create session until something is stored
    cookie: {
        maxAge: 60000,           // Session lasts for 1 minute (60000 ms)
        httpOnly: true,          // Cookie can't be accessed via JavaScript
        secure: false            // Set to true in production if using HTTPS
    }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Serve error page
app.get('/errorLogin', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/errorPage.html'));
});

// Serve Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Home.html'));
});

// Serve Admin Login page
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/AdminLoginPage.html'));
});

app.get('/AgentProfile' , checkAuthentication, (req , res)=>{
    res.sendFile(path.join(__dirname , '../Frontend/HQ1.html'))
})

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check if credentials match any admin
    const admin = adminCredentials.find(admin => admin.username === username && admin.password === password);

    if (admin) {
        // Store the username in the session to keep track of logged-in user
        req.session.isAuthenticated = true;
        currentUser = username; // Store the logged-in username in session
        return res.redirect("/hq");
    } else {
        // Redirect to error page if login fails
        res.redirect('/errorLogin');
    }
});

// Middleware to check authentication for protected routes
function checkAuthentication(req, res, next) {
    if (req.session.isAuthenticated) {
        next(); // Proceed to the next middleware or route handler
    } else {
        res.redirect('/admin-login'); // Redirect to login if not authenticated
    }
}

// Serve HQ page (only accessible if authenticated)
app.get('/hq', checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/HQ.html'));
});

// Serve Chat Room page (only accessible if authenticated)
app.get('/room', checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Room.html'));
});

// Handle socket.io connections
io.on('connection', (socket) => {
    // Send the current user's username to the chat room
    // const currentUser = socket.request.session.currentUser;


   
    // const currentUser = socket.request.session.currentUser;
        console.log(`${currentUser} user connected`);

        // Send the current user's username to the client
        socket.emit('setUsername', currentUser);

        // Broadcast the user who joined the chat
        io.emit('message', { username: "System", message: `${currentUser} has joined the chat` });

        // Listen for chat messages
        socket.on('chatMessage', (msg) => {
            io.emit('message2', msg);
        });

        // Handle user disconnect
        socket.on('disconnect', () => {
            io.emit('message', { username: "System", message: `${currentUser} has left the chat` });
            console.log(`${currentUser} disconnected`);
        });
    }
);

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log('Server is listening on : http://localhost:' + PORT);
});
