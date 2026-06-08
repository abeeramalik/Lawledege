import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });
app.use(cors());
app.use(express.json());
app.get('/health', (_, res) => res.json({ status: 'ok' }));
const onlineUsers = new Map();
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });
  socket.on('send_message', (data) => {
    const receiverSocketId = onlineUsers.get(data.receiver_id);
    if (receiverSocketId) io.to(receiverSocketId).emit('receive_message', data);
    socket.emit('receive_message', data);
  });
  socket.on('join_group', (groupName) => socket.join(groupName));
  socket.on('group_message', (data) => io.to(data.group_name).emit('group_message', data));
  socket.on('new_post', (post) => socket.broadcast.emit('new_post', post));
  socket.on('new_help_request', (req) => io.emit('new_help_request', req));
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Server on port ${PORT}`));