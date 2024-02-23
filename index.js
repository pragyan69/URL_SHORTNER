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
        // Optional: Handle cases where no visitor ID is present. You might choose to redirect without recording a click.
        console.log('No visitor ID provided. Consider how to handle this case.');
    } else {
        // Extract the client's IP address
        const ip = (req.headers['x-forwarded-for'] || '').split(',').shift().trim() || req.connection.remoteAddress;

        // Check if this visitor ID has already clicked the link
        let clickEntry = urlEntry.clicks.find(click => click.visitorId === visitorId);

        if (!clickEntry) {
            // First click from this visitor
            urlEntry.clicks.push({ visitorId, ip, count: 1 });
        } else {
            // Increment count only if the IP is different, indicating a shared network scenario
            if (clickEntry.ip !== ip) {
                clickEntry.count += 1;
                clickEntry.ip = ip; // Update to the most recent IP
            }
        }

        await urlEntry.save();
    }

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
