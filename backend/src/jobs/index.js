const startOrderCleanup = require("./orderCleanup");

const startJobs = () => {

  console.log("🚀 Starting background jobs...");

  startOrderCleanup();

};

module.exports = startJobs;