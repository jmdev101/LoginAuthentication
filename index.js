import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const app = express();
const port = process.env.PORT;

const pool = new Pool({
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

app.listen(port, () => {
  console.log(`App is running on port ${port}.`);
});
