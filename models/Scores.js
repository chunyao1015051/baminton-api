const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  category: String,
  group_one: String,
  group_two: String,
  result: String,
  winer: String,
  loser: String,
});

module.exports = mongoose.model("Scores", schema);
