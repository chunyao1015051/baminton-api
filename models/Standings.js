const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  category: String,
  group: String,
  win: Number,
  lose: Number,
  scores: Number,
});

module.exports = mongoose.model("Standings", schema);
