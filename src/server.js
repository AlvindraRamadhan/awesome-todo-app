require("dotenv").config();
const http = require('http');
const app = require("./app");
const connectDB = require('./config/db');
const initSocket = require('./socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);

// Make io accessible to our controllers
app.set('socketio', io);

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to the database", error);
        process.exit(1);
    }
}

startServer();
