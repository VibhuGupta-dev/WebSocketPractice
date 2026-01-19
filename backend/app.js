import express from "express";
import { Server } from "socket.io";
import { join } from "node:path";
import { createServer } from "node:http";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(cors({ origin: "*" }));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

server.listen(3000, () => {
  console.log("Server running → http://localhost:3000");
  console.log("Socket.IO is now available");
});

const socketIds = []; // Array to track active IDs

io.on('connection', (socket) => {
  console.log("User connected →", socket.id);
  socketIds.push(socket.id);
  console.log("Active users:", socketIds);

  // Emit updated total to EVERYONE (including new user)
  io.emit("totalperson", socketIds.length);
  console.log("Total connected:", socketIds.length); // For server logging

  socket.on("user:join", (username) => {
    console.log(`${username} joined`);

    // Send to EVERYONE (including sender)
    io.emit("user:joined", {
      username,
      socketId: socket.id,
    });
  });

  socket.on("sendMessage", (data) => {
  io.emit("message", {
    text: data.text,
    sender: data.sender
  });
});

  // Handle disconnection for THIS specific socket
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    
    // Remove the ID from the array to prevent memory leaks
    const index = socketIds.indexOf(socket.id);
    if (index > -1) {
      socketIds.splice(index, 1);
    }
    
    // Emit updated total to remaining users
    io.emit("totalperson", socketIds.length);
    console.log("Remaining users:", socketIds);
  });
});