const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  category: String,
  group_one: String,
  group_two: String,
  group_one_scores: Number,
  group_two_scores: Number,
});

module.exports = mongoose.model("Scores", schema);
