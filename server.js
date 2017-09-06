var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;


var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost/tribe");
var db = mongoose.connection;

db.on("error", function (error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function () {
  console.log("Mongoose connection successful.");
});

//Routes

app.get("/scrape", function (req, res) {
  request("http://www.espn.com/mlb/team/_/name/cle/cleveland-indians", function (error, response, html) {
    var $ = cheerio.load(html);
    $("article h1").each(function (i, element) {

      var result = {};

      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      var entry = new Article(result);
      console.log(entry);

      entry.save(function (err, doc) {

        if (err) {
          console.log(err);
        }

        else {
          console.log(doc);
        }
      });

    });
  });

  res.send("Scrape Complete");
});

app.get("/articles", function (req, res) {

  Article.find({}, function (error, doc) {

    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});


app.get("/articles/:id", function (req, res) {

  Article.findOne({ "_id": req.params.id })

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



app.post("/articles/:id", function (req, res) {

  var newNote = new Note(req.body);


  newNote.save(function (error, doc) {

    if (error) {
      console.log(error);
    }

    else {

      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
        .exec(function (err, doc) {
          if (err) {
            console.log(err);
          }
          else {

            res.send(doc);
          }
        });
    }
  });
});


app.listen(process.env.PORT || 3000, function () {
  console.log("App running on port 3000!");
});