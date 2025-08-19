const { Server } = require("socket.io");

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Adjust for production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Listener for a client to join project rooms
        socket.on('joinProjects', (projectIds) => {
            if (Array.isArray(projectIds)) {
                projectIds.forEach(projectId => {
                    socket.join(projectId.toString());
                    console.log(`Socket ${socket.id} joined room ${projectId.toString()}`);
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

module.exports = initSocket;
