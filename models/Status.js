const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  category: String,
  nowLeft: String,
  newRight: String,
  NextLeft: String,
  NextRight: String,
});

module.exports = mongoose.model("Status", schema);
