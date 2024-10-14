import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import "dotenv/config";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";

const { Pool } = pg;
const saltRounds = 10;

const app = express();
const port = process.env.PORT;

app.use(
  session({
    secret: "SECRETWORD",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
});

const checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

const checkLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/welcome");
  }
  next();
};

app.get("/", checkLoggedIn, (req, res) => {
  res.render("home.ejs");
});

app.get("/login", checkLoggedIn, (req, res) => {
  res.render("login.ejs");
});

app.get("/register", checkLoggedIn, (req, res) => {
  res.render("register.ejs");
});

app.get("/welcome", checkAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("welcome.ejs", { email: req.user.email });
});

app.post("/register", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows[0]) {
      console.log("Account already exists.");
      res.redirect("/register");
    } else {
      bcrypt.hash(password, saltRounds, async function (err, hash) {
        const getData = await db.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *", [email, hash]);

        req.login(getData.rows[0], function (err) {
          if (err) {
            return next(err);
          }
          res.redirect("/welcome");
        });
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/welcome",
    failureRedirect: "/login",
  })
);

passport.use(
  "local",
  new Strategy({ usernameField: "email" }, async function verify(email, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
      console.log("uwu");

      if (result.rows[0]) {
        const hash = result.rows[0].password;
        const getUser = result.rows[0];

        bcrypt.compare(password, hash, function (err, result) {
          if (result) {
            return cb(null, getUser);
          } else {
            console.log("Incorrect email or password.");
            return cb(null, false);
          }
        });
      } else {
        return cb(null, false);
      }
    } catch (err) {
      return cb(err);
    }
  })
);

app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

passport.serializeUser((userObj, cb) => {
  cb(null, { id: userObj.id, email: userObj.email });
});

passport.deserializeUser((userObj, cb) => {
  cb(null, userObj);
});

app.listen(port, () => {
  console.log(`App is running on port ${port}.`);
});
