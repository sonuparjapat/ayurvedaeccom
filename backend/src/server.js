require("dotenv").config();

const http = require('http');
const app = require("./app");
const { initSocket } = require("./socket");
const initDB = require("./database/init");
const startJobs = require("./jobs");
const startWorker = require('./workers/jobWorker');

const PORT = process.env.PORT || 5000;

(async () => {
  await initDB();
  startWorker();
  startJobs();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log("🚀 Server running on " + PORT);
  });
})();
