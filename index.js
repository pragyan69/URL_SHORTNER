require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl'); // This will be your model
const cors = require('cors')
const cookieParser = require('cookie-parser');

const { v4: uuidv4 } = require('uuid');
function generateUniqueVisitorId() {
    return uuidv4();
}


const app = express();
app.use(cors({
    origin: '*' // This will allow requests from any origin
}));

app.use(cookieParser())
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('connected', () => {
    console.log('MongoDB database connection established successfully');
  });
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
    const { shortUrl } = req.params;
    const urlEntry = await ShortUrl.findOne({ shortUrl: shortUrl });

    if (urlEntry) {
        const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(",")[0];
        let clickEntry = urlEntry.clicks.find(c => c.ip === ip);

        if (clickEntry) {
            clickEntry.count++;
        } else {
            urlEntry.clicks.push({ ip, count: 1 });
        }

        await urlEntry.save();
        res.redirect(urlEntry.originalUrl);
    } else {
        res.status(404).send('Shortened URL not found');
    }
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
