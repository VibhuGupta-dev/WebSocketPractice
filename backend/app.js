import express from "express";
import { Server } from "socket.io";
import { join } from "node:path";
import { createServer } from "node:http";
import cors from "cors";
import { send } from "node:process";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


const usernameToSocketMapping = new Map();
const socketToUsernameMapping = new Map()

app.use(express.json());
app.use(cors({ origin: "*" }));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

server.listen(3000, () => {
  console.log("Server running → http://localhost:3000");
  console.log("Socket.IO is now available");
});

const socketIds = []; 
const usernames = []
io.on('connection', (socket) => {
  console.log("User connected →", socket.id);
  socketIds.push(socket.id);
  console.log("Active users:", socketIds);

  io.emit("totalperson", socketIds.length);
  console.log("Total connected:", socketIds.length); 

  io.emit('allpeople' , usernames)
  console.log(usernames)
socket.on("user:join", (username) => {
  console.log(`${username} joined`);
  usernames.push(username)
  // ✅ STORE MAPPINGS
  usernameToSocketMapping.set(username, socket.id);
  socketToUsernameMapping.set(socket.id, username);

  io.emit("user:joined", {
    username,
    socketId: socket.id,
  });
});

socket.on('call-user', (data) => {
  const { username, offer } = data;

  const fromusername = socketToUsernameMapping.get(socket.id);
  const socketId = usernameToSocketMapping.get(username);

  if (!socketId) {
    console.log("Target user not found:", username);
    return;
  }

  socket.to(socketId).emit('incomming-call', {
    from: fromusername,
    offer
  });

  console.log("call-user data:", data);
});

socket.on("call-accepted", ({ to, ans }) => {
  const socketId = usernameToSocketMapping.get(to);
  if (!socketId) return;

  socket.to(socketId).emit("call-accepted", { ans });
});


  socket.on("sendMessage", (data) => {
  io.emit("message", {
    text: data.text,
    sender: data.sender
  });
});

// Server-side (example)
socket.on("sendPhoto", (data) => {
  io.emit("photo", {
    image: data.image,       
    sender: data.sender,
    timestamp: data.timestamp,
  });
});
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    
    
    const index = socketIds.indexOf(socket.id);
    if (index > -1) {
      socketIds.splice(index, 1);
    }
    
    io.emit("totalperson", socketIds.length);
    console.log("Remaining users:", socketIds);
  });
});

