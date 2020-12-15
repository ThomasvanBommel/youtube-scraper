# youtube-scraper

Scrapes featured videos from a YouTube XML API. Will only scrape a few videos. (~5 - 15 latest / featured videos) It will do this once per hour by default, store the values, and add that information to express's `req.youtube_data` object.

This is a JavaScript modules created for use with NodeJS and the express module.

## TODO
 - [ ] code comments / jdoc

## Usage
```js
const YouTubeScraper = require("./modules/youtube-scraper/youtube-scraper");
const express = require("express");

let app = express();

app.use(YouTubeScraper({ id: "ChaNNel_Id-C0de" }));

app.all("*", (req, res) => {
  console.log(req.youtube_data);
});
```
