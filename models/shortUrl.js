const mongoose = require('mongoose');
const shortId = require('shortid');

const shortUrlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: { type: String, unique: true, default: shortId.generate },
  clicks: [{ ip: String, count: Number }]
});

module.exports = mongoose.model('ShortUrl', shortUrlSchema);
