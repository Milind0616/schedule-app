const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String },
  duration: { type: Number }, // in minutes
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);