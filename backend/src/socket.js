const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.FRONTEND_URL, /^http:\/\/localhost/, /^exp:\/\//].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    // User joins their personal room for order updates
    socket.on('join_user', (userId) => {
      if (userId) socket.join(`user_${userId}`);
    });

    // Admin joins admin room for new order alerts
    socket.on('join_admin', () => {
      socket.join('admin_room');
    });

    // Support ticket room
    socket.on('join_ticket', (ticketId) => {
      if (ticketId) socket.join(`ticket_${ticketId}`);
    });

    socket.on('leave_ticket', (ticketId) => {
      if (ticketId) socket.leave(`ticket_${ticketId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

function getIO() {
  if (!io) return null;
  return io;
}

function emitToUser(userId, event, data) {
  if (io) io.to(`user_${userId}`).emit(event, data);
}

function emitToAdmin(event, data) {
  if (io) io.to('admin_room').emit(event, data);
}

function emitToTicket(ticketId, event, data) {
  if (io) io.to(`ticket_${ticketId}`).emit(event, data);
}

function emitToAll(event, data) {
  if (io) io.emit(event, data);
}

module.exports = { initSocket, getIO, emitToUser, emitToAdmin, emitToTicket, emitToAll };
