const path = require("node:path");

//(DO NOT TOUCH) Defines where data should be stored 
const data_path = path.join(__dirname, "data.json");

// Data server settings
const host = "localhost";
const port = 8000;

// Watcher settings
const local_check_interval = 1000 * 20        // How often the watcher should run (doesn't affect how often you are notified)

module.exports = {
  data_path,
  host,
  port,
  local_check_interval
}
