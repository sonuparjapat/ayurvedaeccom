const { Server } = require('socket.io');
const os = require('os');

let io = null;
let connectedCount = 0;

function getLiveStats() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);
  const [load1] = os.loadavg();
  const cpuCount = os.cpus().length;
  const cpuPercent = Math.round((load1 / cpuCount) * 100);
  return {
    connectedUsers: connectedCount,
    cpu: Math.min(cpuPercent, 100),
    memory: memPercent,
    uptime: Math.floor(process.uptime()),
    freeMemMB: Math.round(freeMem / 1024 / 1024),
    totalMemMB: Math.round(totalMem / 1024 / 1024),
  };
}

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
    connectedCount++;
    io.to('admin_room').emit('server_stats', getLiveStats());

    // User joins their personal room for order updates
    socket.on('join_user', (userId) => {
      if (userId) socket.join(`user_${userId}`);
    });

    // Admin joins admin room for new order alerts
    socket.on('join_admin', () => {
      socket.join('admin_room');
      // Send current stats immediately on admin join
      socket.emit('server_stats', getLiveStats());
    });

    // Support ticket room
    socket.on('join_ticket', (ticketId) => {
      if (ticketId) socket.join(`ticket_${ticketId}`);
    });

    socket.on('leave_ticket', (ticketId) => {
      if (ticketId) socket.leave(`ticket_${ticketId}`);
    });

    socket.on('disconnect', () => {
      connectedCount = Math.max(0, connectedCount - 1);
      io.to('admin_room').emit('server_stats', getLiveStats());
    });
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

module.exports = { initSocket, getIO, getLiveStats, emitToUser, emitToAdmin, emitToTicket, emitToAll };
