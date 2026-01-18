import express from "express"
import {Server} from "socket.io"
import {createServer} from "node:http"
import { Socket } from "node:dgram"
const app = express()

const server = createServer(app)
const io = new Server(server)

app.use(express.json())


io.on('connection' , (Socket) => {
    console.log("user is connected")
})

app.get("/" , (req ,  res) => {
    res.send("hey there")
})

app.listen(3000, () => {
    console.log("Server running on port 3000")
})