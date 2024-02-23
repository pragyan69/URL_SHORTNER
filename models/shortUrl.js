const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
    visitorId: String,
    ip: String,
    count: Number,
});

const shortUrlSchema = new mongoose.Schema({
    originalUrl: String,
    shortUrl: { type: String, unique: true },
    clicks: [clickSchema],
});

module.exports = mongoose.model('ShortUrl', shortUrlSchema);
