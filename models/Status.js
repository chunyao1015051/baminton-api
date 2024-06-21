const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  category: String,
  nowLeft: String,
  nowRight: String,
  nextLeft: String,
  nextRight: String,
});

module.exports = mongoose.model('Status', schema);
