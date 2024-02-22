require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl'); // This will be your model
const cors = require('cors')
const app = express();
app.use(cors({
    origin: '*' // This will allow requests from any origin
}));
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
// MongoDB connection success event
mongoose.connection.on('connected', () => {
    console.log('MongoDB database connection established successfully');
  });
  
  // MongoDB connection error event
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });
  
app.use(express.json());

const port = process.env.PORT || 3005;

// Route to create a short URL
app.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;
    const shortUrl = new ShortUrl({ originalUrl });
    await shortUrl.save();
    res.json(shortUrl);
  });
  
  // Route to redirect to the original URL and track click
  app.get('/:shortUrl', async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ shortUrl: req.params.shortUrl });
    if (!shortUrl) {
      return res.sendStatus(404);
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const clickIndex = shortUrl.clicks.findIndex(click => click.ip === ip);
  
    if (clickIndex >= 0) {
      shortUrl.clicks[clickIndex].count++;
    } else {
      shortUrl.clicks.push({ ip, count: 1 });
    }
  
    await shortUrl.save();
    res.redirect(shortUrl.originalUrl);
  });

  // Route to get click statistics
app.get('/clicks/:shortUrl', async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ shortUrl: req.params.shortUrl });
    if (!shortUrl) {
      return res.sendStatus(404);
    }
    res.json(shortUrl.clicks);
  });
  
  
app.listen(port, () => console.log(`Listening on port ${port}`));
