const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: String,
  phone: String,
  category: String,
  group: String,
  qty: Number,
});

module.exports = mongoose.model("Onlookers", schema);
