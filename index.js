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


app.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;
    const shortUrl = new ShortUrl({ originalUrl });
    await shortUrl.save();
    res.json(shortUrl);
  });
  

app.get('/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    const urlEntry = await ShortUrl.findOne({ shortUrl: shortUrl });
  
    if (!urlEntry) {
      return res.status(404).send('Shortened URL not found');
    }
  
    const visitorId = req.cookies.visitorId || req.query.visitorId;
    if (!visitorId) {
      // No visitor ID provided, can't track uniquely, consider how you want to handle this case
      return res.redirect(urlEntry.originalUrl);
    }
  
    // Implement logic to track click with both IP and visitorId here
    // This is a simplified version, you'll need to adjust based on your schema and requirements
  
    // Save and redirect
    await urlEntry.save();
    res.redirect(urlEntry.originalUrl);
  });
  

app.get('/clicks/:shortUrl', async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ shortUrl: req.params.shortUrl });
    if (!shortUrl) {
      return res.sendStatus(404);
    }
    res.json(shortUrl.clicks);
  });
 
app.listen(port, () => console.log(`Listening on port ${port}`));
