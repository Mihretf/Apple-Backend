const mysql = require("mysql2");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
require('dotenv').config();

const cors = require("cors");

// Initialize Express app
var app = express();
app.use(cors());
app.use(express.json()); // Add this line
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(3001, () => console.log("Listening on port 3001"));

// Use body-parser middleware to parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));



// MySQL database connection (single connection for the entire app)

const mysqlConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

mysqlConnection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// Routes for creating tables
app.get("/install", (req, res) => {
  let message = "Tables Created";

  let createProducts = `CREATE TABLE IF NOT EXISTS \`Product Table\` (
    product_id INT AUTO_INCREMENT,
    product_url VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (product_id)
  )`;

  let createProductDescription = `CREATE TABLE IF NOT EXISTS \`Product Description Table\` (
    description_id INT AUTO_INCREMENT,
    product_id INT NOT NULL,
    product_brief_description VARCHAR(255) NOT NULL,
    product_description TEXT NOT NULL,
    product_img VARCHAR(255) NOT NULL,
    product_url VARCHAR(255) NOT NULL,
    PRIMARY KEY (description_id),
    FOREIGN KEY (product_id) REFERENCES \`Product Table\`(product_id)
  )`;

  let createProductPrice = `CREATE TABLE IF NOT EXISTS \`Product Price Table\` (
    price_id INT AUTO_INCREMENT,
    product_id INT NOT NULL,
    starting_price VARCHAR(255) NOT NULL,
    price_range VARCHAR(255) NOT NULL,
    PRIMARY KEY (price_id),
    FOREIGN KEY (product_id) REFERENCES \`Product Table\`(product_id)
  )`;

  let createOrders = `CREATE TABLE IF NOT EXISTS \`Orders Table\` (
    order_id INT AUTO_INCREMENT,
    product_id INT,
    user_id INT NOT NULL,
    PRIMARY KEY (order_id),
    FOREIGN KEY (product_id) REFERENCES \`Product Table\`(product_id)
  )`;

  let userTable = `CREATE TABLE IF NOT EXISTS \`Users Table\` (
    user_id INT NOT NULL,
    username TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES \`Orders Table\`(user_id)
  )`;

  // Execute all queries
  mysqlConnection.query(createProducts, (err) => {
    if (err) console.log(err);
  });
  mysqlConnection.query(createProductDescription, (err) => {
    if (err) console.log(err);
  });
  mysqlConnection.query(createProductPrice, (err) => {
    if (err) console.log(err);
  });
  mysqlConnection.query(createOrders, (err) => {
    if (err) console.log(err);
  });
  mysqlConnection.query(userTable, (err) => {
    if (err) console.log(err);
  });

  res.end(message);
});

// Route to add a product
app.post("/add-product", (req, res) => {
  let product_name = req.body.product_name;
  let product_url = req.body.product_url;
  let product_img = req.body.product_img;
  let product_brief_description = req.body.product_brief_description;
  let product_description = req.body.product_description;
  let product_link = req.body.product_link;
  let price_range = req.body.price_range;
  let starting_price = req.body.starting_price;

  // Insert into the product table using prepared statements
  let insertProduct = `INSERT INTO Product Table (product_url, product_name) VALUES (?, ?);`;

  mysqlConnection.query(insertProduct, [product_url, product_name], (err, result) => {
    if (err) {
      console.error("SQL Error:", err.message);
      return res.status(500).send("Error inserting product.");
    }

    const prdctId = result.insertId;

    // Prepare inserts for the description table and price table
    const insertDescriptionTable = `INSERT INTO \`Product Description Table\` (product_id, product_brief_description, product_description, product_img, product_url) VALUES (?, ?, ?, ?, ?);`;
    const insertProductPrice = `INSERT INTO \`Product Price Table\` (product_id, starting_price, price_range) VALUES (?, ?, ?);`;

    // Execute the description insert
    mysqlConnection.query(insertDescriptionTable, [prdctId, product_brief_description, product_description, product_img, product_link], (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error inserting product description.");
      }

      // Execute the price insert
      mysqlConnection.query(insertProductPrice, [prdctId, starting_price, price_range], (err) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Error inserting product price.");
        }

        // If everything is successful, send a success message
        res.send("Product added successfully!");
      });
    });
  });
});
// Route to view all products
app.get("/iphones", (req, res) => {
  const query = `
    SELECT *
    FROM \`Product Table\`
    INNER JOIN \`Product Description Table\` ON \`Product Table\`.product_id = \`Product Description Table\`.product_id
    INNER JOIN \`Product Price Table\` ON \`Product Table\`.product_id = \`Product Price Table\`.product_id
  `;

  mysqlConnection.query(query, (err, rows) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error fetching products." });
    }

    res.json({ products: rows });
  });
});

// Route to show a summary page
app.get("/summary", (req, res) => {
  res.sendFile(path.join(__dirname, "summary.html"));
});

// Route to show database tables
app.get("/tables", (req, res) => {
  mysqlConnection.query("SHOW TABLES", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ tables: results });
  });
});
