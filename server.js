// Dependencies
var express = require("express");
var expbhs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

// Require Models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Morgna for Logging
app.use(logger("dev"));
// Parse for JSON Format
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Use Public Static Folder
app.use(express.static("public"));

// Mongo DB Connection

// mongoose.connect("mongodb://localhost/news", { useNewUrlParser: true });

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);


// Routes

// GET Route for Scraping News Site
app.get("/scrape", function (req, res) {
  // Use Axios to Grab HTML Body
  axios.get("https://www.nytimes.com/").then(function (response) {
    // Save HTML Body to Cheerio for Shorthand
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function (dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({}, function (error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ "_id": req.params.id })
    .populate("note")
    .exec(function (error, doc) {
      if (error) {
        console.log(error);
      }
      else {
        res.json(doc);
      }
    });
});

// Route for saving/updating an Article's associated Note
// TODO
// ====
// save the new note that gets posted to the Notes collection
// then find an article from the req.params.id
// and update it's "note" property with the _id of the new note
app.post("/articles/:id", function (req, res) {
  var newNote = new Note({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body)
  // And save the new note the db
  newNote.save(function (error, note) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's notes
      db.Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "note": note } })
        // Execute the above query
        .exec(function (err) {
          // Log any errors
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            // Or send the note to the browser
            res.send(note);
            console.log(note);
          }
        });
    }
  });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on http://localhost:" + PORT);
});
