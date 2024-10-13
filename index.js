import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import "dotenv/config";
import bcrypt from "bcrypt";
import passport from "passport";
import LocalStrategy from "passport-local";

const { Pool } = pg;
const saltRounds = 10;

const app = express();
const port = process.env.PORT;

const db = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/welcome", (req, res) => {
  res.render("welcome.ejs");
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
        await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, hash]);
      });

      res.render("welcome.ejs");
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows[0]) {
      const hash = result.rows[0].password;

      bcrypt.compare(password, hash, function (err, result) {
        if (result) {
          res.render("welcome.ejs");
        } else {
          console.log("Incorrect email or password.");
          res.redirect("/login");
        }
      });
    } else {
      console.log("Account does not exists.");
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`App is running on port ${port}.`);
});
