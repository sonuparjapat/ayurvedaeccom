require("dotenv").config();

const app = require("./app");
const initDB = require("./database/init");
const startJobs = require("./jobs");
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>crons>>>>>>>>>>>>>>>
const startWorker =
require('./workers/jobWorker')
startWorker()
startJobs();
const PORT = process.env.PORT || 5000;

(async () => {

  await initDB();

  app.listen(PORT, () => {
    console.log("🚀 Server running on " + PORT);
  });

})();