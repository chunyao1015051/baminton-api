const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  category: String,
  isBringingRacket: String,
  score: Number,
  group: String,
});

module.exports = mongoose.model("User", userSchema);
