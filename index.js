const express = require("express");
const app = express();
const port = 3000;
const request = require("request");
const bp = require("body-parser");
const hashpsw = require("password-hash");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

var serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
app.use(bp.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("start.ejs");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signupsubmit", (req, res) => {
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const password = req.body.psw;
  const rep_psw = req.body.psw_repeat;

  //Adding data to the collection
  if (password == rep_psw) {
    db.collection("users")
      .add({
        name: first_name + " " + last_name,
        email: email,
        password: hashpsw.generate(password),
      })
      .then(() => {
        res.render("signin");
      });
  } else {
    res.send("SignUP Failed");
  }
});

app.get("/signin", (req, res) => {
  res.render("signin");
});

app.post("/signinsubmit", (req, res) => {
  const email = req.body.emil;
  const password = req.body.passwrd;

  db.collection("users")
    .where("email", "==", email)
    .get()
    .then((docs) => {
      // if (docs.size > 0) {
      //   const ud = docs[0].data();
      //   // if(!hashpsw.verify(password, ud.password))
      //   var usersData = [];
      //   db.collection("users")
      // .get()
      // .then(() => {
      //   docs.forEach((doc) => {
      //     usersData.push(doc.data());
      //   });
      // })
      // .then(() => {
      //   console.log(usersData);
      //   res.render("home", { userData: usersData });
      // });
      // } else {
      //   res.send("Login Failed");
      // }
      if (docs.size > 0) {
        let verified = false;
        docs.forEach((doc) => {
          verified = hashpsw.verify(password, doc.data().password);
        });
        if (verified) {
          var usersData = [];
          db.collection("users")
            .get()
            .then(() => {
              docs.forEach((doc) => {
                usersData.push(doc.data());
              });
            })
            .then(() => {
              console.log(usersData);
              res.render("home", { userData: usersData });
            });
        } else {
          res.send("Login Failed");
        }
      }
    });
});

app.get("/movie", (req, res) => {
  res.render("movie");
});

const API_KEY = "api_key=65c72562ffa13a6ef5e5967eb6186747";
const BASE_URL = "https://api.themoviedb.org/3";
const API_URL = BASE_URL + "/discover/movie?sort_by=popularity.desc&" + API_KEY;
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const searchURL = BASE_URL + "/search/movie?" + API_KEY;

app.get("/movienamesearch", (req, res) => {
  const moviename = req.query.moviename;
  var movieData = [];

  var url;
  if (moviename) {
    url = searchURL + "&query=" + moviename;
  } else {
    url = API_URL;
  }
  request(url, function (error, response, body) {
    var data = JSON.parse(body).results;
    if (data) {
      showMovies(data);

      function showMovies(data) {
        data.forEach((movie) => {
          movieData.push(movie);
        });
      }
      console.log(movieData);
      res.render("movie", { userData: movieData });
    } else {
      console.log("not thier");
    }
  });
});
app.listen(port, () => {
  console.log(`Your APP is running in the port ${port}`);
});