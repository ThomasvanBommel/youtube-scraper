/**
 * YouTube channel video scraper
 * @author Thomas vanBommel
 * @since 12-12-2020
 */
const https = require("https");
const { parseString } = require("xml2js");

class YouTubeScraper {
  /**
   * Scrape video information from youtubes XML feed, accessable from req.youtube_data
   * @constructor
   * @param {Object} options - Middleware options
   * @param {string} options.id - YouTube channel id string
   * @param {number} [options.freq=1] - How often (hours) to update data (only updates upon request)
   */
  constructor(options){
    this.url = `https://www.youtube.com/feeds/videos.xml?channel_id=${options.id}`;
    this.freq = options.freq ? options.freq : 1;
  }

  /**
   * Callback function for errors and data
   * @callback callback
   * @param {Object | string} err - null unless it contains an error message
   * @param {Object} data - data received after the function call returned
   */
  /**
   * Update the data object
   * @function
   * @param {callback} callback - Error and data callback
   */
  update = callback => {
    let req = https.request(this.url, res => {
      let result = "";

      // add up data received from youtube
      res.on("data", chunk => { result += chunk; });

      // parse the data into a js object
      res.on("end", () => {
        parseString(result, (err, obj) => {
          if(!err) this.last_updated = Date.now();

          let result = {
            name : obj.feed.title,
            id : obj.feed["yt:channelId"][0],
            author : obj.feed.author[0].name[0],
            url : obj.feed.author[0].uri[0],
            published : obj.feed.published[0],
            latest_uploads : []
          };

          for(let video of obj.feed.entry)
            result.latest_uploads.push({
              id: video["yt:videoId"],
              title: video.title[0],
              published: video.published[0],
              updates: video.updated[0],
              url: video.link[0]["$"].href,
              content: video["media:group"][0]["media:content"][0]["$"],
              thumbnail: video["media:group"][0]["media:thumbnail"][0]["$"],
              description: video["media:group"][0]["media:description"][0],
              rating: video["media:group"][0]["media:community"][0]["media:starRating"][0]["$"],
              views: video["media:group"][0]["media:community"][0]["media:statistics"][0]["$"].views
            });

          console.log(`${new Date().toISOString()} : Updated YouTubeScraper Data`);
          callback(err, result);
        });
      });
    });

    // callback error
    req.on("error", err => { callback(err); });

    // send request
    req.end();
  };

  /**
   * Express middleware to keep the video data accessable from req.youtube_data
   * @function
   * @param {Object} req - Express request "req" object
   * @param {Object} res - Express request "res" object
   * @param {Object} next - Express request "next" object
   */
  middleware = (req, res, next) => {
    // if it's been an hour since the last update or data is undefined
    if(typeof this.data === "undefined" ||
       Date.now() - this.last_updated > 3600000 * this.freq){
      this.update((err, data) => {
        if(err) next(err);

        this.data = data;
        req.youtube_data = data;
        next();
      });
    }else{
      req.youtube_data = this.data;
      next();
    }
  };
}

/**
 * Scrape video information from youtubes XML feed
 * @constructor
 * @param {Object} options - Middleware options
 * @param {string} options.id - YouTube channel id string
 * @param {number} [options.freq=1] - How often (hours) to update data (only updates upon request)
 */
module.exports = options => {
  return new YouTubeScraper(options).middleware;
};
