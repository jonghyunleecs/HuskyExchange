/**
 * Name: Joshua Ren and Jong-Hyun Lee
 * Date: 12.06.2024
 * Section: CSE 154 AB
 * This is the app.js file for the HuskyExchange website. It allows the user to create an account,
 * log in, get the username of the logged in user, get a list of the all the products available
 * for purchase, search and filter through those products, buy products, get a list of all the
 * products they've purchased, get information about an individual product, sell a product,
 * and analyze a product to see if it's a good deal.
 */

"use strict";
const express = require("express");
const multer = require("multer");
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const OpenAI = require("openai");
const app = express();
const SERVER_ERROR_CODE = 500;
const USER_ERROR_CODE = 400;
const INVALID_AUTHENTICATION_ERROR_CODE = 401;
const ANALYSIS_CHARACTER_LIMIT = 150;
const MISSING_PARAM_MESSAGE = "Missing one or more of the required parameters.";
const SERVER_ERROR_MESSAGE = "An error occurred on the server.";
const INVALID_AUTHENTICATION_ERROR_MESSAGE = "Not logged in.";
const PORT_NUMBER = 8000;
const TOKEN_COUNT = 10;
const OPENAI_KEY = "sk-proj-DJI2suXW_jnxhsNXSYqIsN2RpZcmTJ40M317RZZg0K897RrlqTyF31CRJ7fGoYxgj9r0" +
"Dqg8jlT3BlbkFJF2nHKKJw3m5XYv9S8muCavUcQJ4FmSZUB3bmONjIhmKcNqD8SilDvZgpCLvzwH46JuOFNKTFoA";
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());
app.use(cookieParser());
const openai = new OpenAI({apiKey: OPENAI_KEY});

// Creates an account for the user
app.post("/user/signup", async function(req, res) {
  try {
    const data = req.body;
    const username = data.username;
    const email = data.email;
    let password = data.password;
    const passwordConfirm = data["password-confirm"];
    if (!username || !password || !passwordConfirm || !email) {
      res.type("text").status(USER_ERROR_CODE)
        .send(MISSING_PARAM_MESSAGE);
    } else {
      const db = await getDBConnection();
      const rows = await getUserData(db, username);
      if (rows.length !== 0) {
        res.type("text").status(USER_ERROR_CODE)
          .send("Username already in use");
      } else if (password !== passwordConfirm) {
        res.type("text").status(USER_ERROR_CODE)
          .send("Passwords don't match");
      } else {
        await createAccount(db, password, username, email);
        res.type("text").send(username + "'s account was succesfully created.");
      }
      await db.close();
    }
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE)
      .send(SERVER_ERROR_MESSAGE);
  }
});

// Logs the user in
app.post("/user/login", async function(req, res) {
  try {
    const data = req.body;
    const username = data.username;
    const password = data.password;
    if (!username || !password) {
      res.type("text").status(USER_ERROR_CODE)
        .send(MISSING_PARAM_MESSAGE);
    } else {
      const db = await getDBConnection();
      const rows = await getUserData(db, username);
      if (rows.length === 0) {
        res.type("text").status(USER_ERROR_CODE)
          .send("No such user");
      } else if (await comparePassword(password, rows[0].password)) {
        res.type("text").send(await storeAccessToken(username));
      } else {
        res.type("text").status(USER_ERROR_CODE)
          .send("Password doesn't match username");
      }
      await db.close();
    }
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE)
      .send(SERVER_ERROR_MESSAGE);
  }
});

// Searches the products for all products containing the search query
app.get("/products/search/:searchQuery", async function(req, res) {
  try {
    const data = req.params;
    const searchQuery = data.searchQuery;
    const db = await getDBConnection();
    const qry = "SELECT id FROM products WHERE (name LIKE ? OR description LIKE ?) AND purchased" +
    " LIKE 0;";
    const rows = await db.all(qry, ["%" + searchQuery + "%", "%" + searchQuery + "%"]);
    await db.close();
    res.type("json").send(rows);
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE)
      .send(SERVER_ERROR_MESSAGE);
  }
});

// Filters the products based on category
app.get("/products/filter", async function(req, res) {
  try {
    const checkboxData = getCheckboxData(req.query);
    let clothing = checkboxData[0];
    let furniture = checkboxData[1];
    let schoolSupplies = checkboxData[2];
    let paramCount = checkboxData[3];
    let rows;
    const db = await getDBConnection();
    if (paramCount === 0) {
      res.type("text").status(USER_ERROR_CODE)
        .send(MISSING_PARAM_MESSAGE);
    } else {
      if (paramCount === 1) {
        const qry = "SELECT id FROM products WHERE category LIKE ? AND purchased LIKE 0;";
        rows = await db.all(qry, [clothing + furniture + schoolSupplies]);
      } else if (paramCount === 2) {
        rows = await twoParametersFilter(db, clothing, furniture, schoolSupplies);
      } else if (paramCount === 3) {
        rows = await threeParametersFilter(db);
      }
      await db.close();
      res.type("json").send(rows);
    }
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE)
      .send(SERVER_ERROR_MESSAGE);
  }
});

// Gets all of the previous purchases conducted by the logged in user
app.get("/user/purchases", async function(req, res) {
  try {
    const authentication = await verifyAccessToken(req.cookies.authorization);
    if (!authentication) {
      res.type("text").status(INVALID_AUTHENTICATION_ERROR_CODE)
        .send(INVALID_AUTHENTICATION_ERROR_MESSAGE);
    } else {
      const db = await getDBConnection();
      const qry = "SELECT id, name, seller, price, image, description, purchase_date FROM " +
      "purchases WHERE buyer LIKE ? ORDER BY id DESC;";
      const rows = await db.all(qry, [authentication]);
      res.type("json").send(rows);
      await db.close();
    }
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE)
      .send(SERVER_ERROR_MESSAGE);
  }
});

// Gets all of the products available for purchase
app.get("/products/all", async function(req, res) {
  try {
    const db = await getDBConnection();
    const qry = "SELECT id, username, name, price, image, description FROM products WHERE " +
    "purchased LIKE 0 ORDER BY id DESC;";
    const rows = await db.all(qry);
    await db.close();
    res.type("json").send(rows);
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE)
      .send(SERVER_ERROR_MESSAGE);
  }
});

// Lists a product for sale
app.post("/products/add", async function(req, res) {
  try {
    const authentication = await verifyAccessToken(req.cookies.authorization);
    if (!authentication) {
      res.type("text").status(INVALID_AUTHENTICATION_ERROR_CODE)
        .send(INVALID_AUTHENTICATION_ERROR_MESSAGE);
    } else {
      const data = req.body;
      if (!data.name || !data.price || !data.image || !data.description || !data.category) {
        res.type("text").status(USER_ERROR_CODE)
          .send(MISSING_PARAM_MESSAGE);
      } else if (data.category !== "Clothing" && data.category !== "Furniture" &&
        data.category !== "School Supplies") {
        res.type("text").status(USER_ERROR_CODE)
          .send("Category parameter doesn't match category options");
      } else {
        const findRows = await addProduct(authentication, data);
        res.type("json").send(findRows);
      }
    }
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE)
      .send(SERVER_ERROR_MESSAGE);
  }
});

// Checks if anybody is logged in
app.get("/user/logged-in", async function(req, res) {
  try {
    const token = req.cookies.authorization;
    res.type("text").send(await verifyAccessToken(token));
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE)
      .send(SERVER_ERROR_MESSAGE);
  }
});

// Gets details about an individual product
app.get("/products/product/:product_id", async function(req, res) {
  try {
    const productId = req.params.product_id;
    const db = await getDBConnection();
    const qry = "SELECT * FROM products WHERE id = ?;";
    const product = await db.get(qry, [productId]);
    await db.close();
    if (product) {
      if (product.purchased === 0) {
        res.type("json").send(product);
      } else {
        res.type("text").status(USER_ERROR_CODE)
          .send("Product has already been sold");
      }
    } else {
      res.type("text").status(USER_ERROR_CODE)
        .send("Product does not exist");
    }
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE)
      .send(SERVER_ERROR_MESSAGE);
  }
});

// Analyzes a product to see if it's a good deal
app.get("/products/analyze/:name/:description/:price", async function(req, res) {
  try {
    const data = req.params;
    const name = data.name;
    const description = data.description;
    const price = data.price;
    const results = await getAIAdvice(name, description, price);
    if (results === "failure") {
      res.type("text").status(SERVER_ERROR_CODE)
        .send("Failed to analyze the provided product");
    } else {
      res.type("text").send(results);
    }
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE)
      .send(SERVER_ERROR_MESSAGE);
  }
});

// Purchases a product for the user
app.post("/products/buy", async function(req, res) {
  res.type("text");
  try {
    const authentication = await verifyAccessToken(req.cookies.authorization);
    if (!authentication) {
      res.status(INVALID_AUTHENTICATION_ERROR_CODE).send(INVALID_AUTHENTICATION_ERROR_MESSAGE);
    } else if (req.body.willingToPickUp !== "true") {
      res.status(USER_ERROR_CODE).send("Willing to pick up parameter must be true");
    } else if (!req.body.id) {
      res.status(USER_ERROR_CODE).send(MISSING_PARAM_MESSAGE);
    } else {
      const product = await getProductInformation(req.body.id);
      if (!product) {
        res.status(USER_ERROR_CODE).send("This item doesn't exist");
      } else if (product.authentication === authentication) {
        res.status(USER_ERROR_CODE).send("You cannot buy an item that you're selling");
      } else if (product.purchased === 0) {
        const purchasedItemsNextId = await purchaseItem(req.body.id, product, authentication);
        res.send(purchasedItemsNextId);
      } else {
        res.status(USER_ERROR_CODE).send("This item has already been purchased");
      }
    }
  } catch (err) {
    res.status(SERVER_ERROR_CODE).send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Adds the purchased item to the database of purchases and marks the item as purchased in the
 * product database
 * @param {String} id - the id of the item that's getting purchased
 * @param {JSON} product - data on the purchase that took place
 * @param {String} username - username of the user who made the purchase
 * @return {String} the confirmation code of the purchase
 */
async function purchaseItem(id, product, username) {
  const db = await getDBConnection();
  const dateObject = new Date();
  const date = dateObject.getFullYear()	+ "-" + dateObject.getMonth() + "-" +
  dateObject.getDate();
  const purchasedQuery = "UPDATE products SET purchased = 1 WHERE id LIKE ?;";
  await db.run(purchasedQuery, [id]);
  const purchasedIdQuery = "SELECT id FROM purchases ORDER BY id DESC LIMIT 1;";
  let purchasedItemsLargestId = await db.all(purchasedIdQuery);
  let purchasedItemsNextId;
  if (purchasedItemsLargestId.length > 0) {
    purchasedItemsLargestId = purchasedItemsLargestId[0].id;
    purchasedItemsNextId = purchasedItemsLargestId.replace("PUR", "");
    purchasedItemsNextId = parseInt(purchasedItemsNextId);
    purchasedItemsNextId++;
    purchasedItemsNextId = "PUR" + purchasedItemsNextId;
  } else {
    purchasedItemsNextId = "PUR0";
  }
  const addToPurchasedQuery = "INSERT INTO purchases ('id', 'name', 'buyer', 'seller', " +
  "'price', 'image', 'description', 'category', 'purchase_date') VALUES (?, ?, ?, ?, ?, " +
  "?, ?, ?, ?);";
  await db.run(addToPurchasedQuery, [purchasedItemsNextId, product.name, username,
  product.username, product.price, product.image, product.description, product.category,
  date]);
  await db.close();
  return purchasedItemsNextId;
}

/**
 * Gets a random letter of the alphabet
 * @return {character} letter of the alphabet
 */
function getRandomLetter() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const randomIndex = Math.floor(Math.random() * alphabet.length);
  return alphabet.charAt(randomIndex);
}

/**
 * Generats a unique identifier that can be used as an access token
 * @return {String} unique id that gets generated
 */
function generateAccessToken() {
  let token = "";
  for (let i = 0; i < TOKEN_COUNT; i++) {
    token += getRandomLetter();
    token += Math.floor(Math.random() * TOKEN_COUNT);
  }
  return token;
}

/**
 * Stores the access token in the user's section database
 * @param {String} user - username of the user who's logged in and getting their access token
 * stored
 * @return {String} The token that got generated and stored
 */
async function storeAccessToken(user) {
  let token = generateAccessToken();
  let tokenMatch = true;
  const db = await getDBConnection();
  while (tokenMatch) {
    const matchQuery = "SELECT * FROM users WHERE TOKEN = ?;";
    const results = await db.all(matchQuery, [token]);
    if (results.length > 0) {
      token = generateAccessToken();
    } else {
      tokenMatch = false;
    }
  }
  const qry = "UPDATE users SET TOKEN = ? WHERE username LIKE ?;";
  await db.run(qry, [token, user]);
  await db.close();
  return token;
}

/**
 * Verifies that the access token is valid
 * @param {String} token - the token that's getting verified
 * @return {String | boolean} if the token is valid, returns string with the username of the user
 * associated with the token. Otherwise a false is returned
 */
async function verifyAccessToken(token) {
  if (!token) {
    return false;
  }
  const db = await getDBConnection();
  const matchQuery = "SELECT username FROM users WHERE TOKEN = ?;";
  const results = await db.all(matchQuery, [token]);
  await db.close();
  if (results.length > 0) {
    return results[0].username;
  }
  return false;
}

/**
 * Encrypts a password
 * @param {String} password - the password that gets encrypted
 * @return {String} hashed version of the password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

/**
 * Compares a password with a hashed password to see if they're equal
 * @param {String} password - the password that's getting compared
 * @param {String} hash - the hashed password that's getting compared
 * @return {boolean} whether or not they're equal
 */
async function comparePassword(password, hash) {
  const match = await bcrypt.compare(password, hash);
  return match;
}

/**
 * Gets AI advice to determine whether or not a product listing is a good deal
 * @param {String} name - name of the product getting analyzed
 * @param {String} description - description of the product getting analyzed
 * @param {String} price - price of the product getting analyzed
 * @return {String} AI's analysis on whether or not it's a good deal
 */
async function getAIAdvice(name, description, price) {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {"role": "user", "content": "There's a product called " + name + " with a description of " +
      description + " and it costs " + price + ". Is this a good deal? Explain using less than " +
      "150 characters. Do not give me an 'it depends' type answer."}
    ]
  });
  let response = completion.choices[0].message.content;
  if (response.length > ANALYSIS_CHARACTER_LIMIT) {
    return "failure";
  }
  return response;
}

/**
 * Creates a new user in the database
 * @param {sqlite3.Database} db - database that's getting modifed
 * @param {String} password - password for the account
 * @param {String} username - username for the account
 * @param {String} email - email for the account
 */
async function createAccount(db, password, username, email) {
  password = await hashPassword(password);
  const qry = "INSERT INTO users ('username', 'email', 'password') VALUES (?, ?, ?);";
  await db.run(qry, [username, email, password]);
}

/**
 * Gets data on the filter parameters sent to the server
 * @param {JSON} data - all the filter parameters
 * @return {Array} List containing all the filter parameters and how many are true
 */
function getCheckboxData(data) {
  let clothing = data.clothing;
  let furniture = data.furniture;
  let schoolSupplies = data.schoolSupplies;
  let paramCount = 0;
  if (clothing) {
    paramCount++;
  } else {
    clothing = "";
  }
  if (furniture) {
    paramCount++;
  } else {
    furniture = "";
  }
  if (schoolSupplies) {
    schoolSupplies = "School Supplies";
    paramCount++;
  } else {
    schoolSupplies = "";
  }
  return [clothing, furniture, schoolSupplies, paramCount];
}

/**
 * Gets all of the products that fit under the categories of clothing, furniture, or school
 * supplies
 * @param {sqlite3.Database} db - database that contains the products
 * @return {JSON} the ids of all the products that fit under the categories
 */
async function threeParametersFilter(db) {
  const qry = "SELECT id FROM products WHERE (category LIKE ? OR category LIKE ? OR " +
  "category LIKE ?) AND purchased LIKE 0;";
  const rows = await db.all(qry, ["Clothing", "Furniture", "School Supplies"]);
  return rows;
}

/**
 * Gets all of the products that fit under two of the following three categories: clothing,
 * furniture, and school supplies
 * @param {sqlite3.Database} db - database that contains the products
 * @param {String} clothing - String representing if clothing is selected; it will either be empty
 * and show that it's not one of the search parameters or containg the "Clothing" string
 * @param {String} furniture - String representing if furniture is selected; it will either be
 * empty and show that it's not one of the search parameters or containg the "Furniture" string
 * @param {String} schoolSupplies - String representing if school supplies is selected; it will
 * either be empty and show that it's not one of the search parameters or containg the "School
 * Supplies" string
 * @return {JSON} the ids of all the products that fit under the categories
 */
async function twoParametersFilter(db, clothing, furniture, schoolSupplies) {
  let filterOne;
  let filterTwo;
  if (clothing) {
    filterOne = clothing;
    if (furniture) {
      filterTwo = furniture;
    } else {
      filterTwo = schoolSupplies;
    }
  } else {
    filterOne = furniture;
    filterTwo = schoolSupplies;
  }
  const qry = "SELECT id FROM products WHERE (category LIKE ? OR category LIKE ?) AND " +
  "purchased LIKE 0;";
  const rows = await db.all(qry, [filterOne, filterTwo]);
  return rows;
}

/**
 * Lists a product for sale in the database
 * @param {String} username - The username of the user adding the product
 * @param {String} data - Data on the product getting added
 * @return {JSON} JSON data version of the product that just got added
 */
async function addProduct(username, data) {
  const db = await getDBConnection();
  const insertQry = "INSERT INTO products ('username', 'name', 'price', 'image', " +
  "'description', 'category', 'purchased') VALUES (?, ?, ?, ?, ?, ?, ?);";
  const row = await db.run(insertQry, [username, data.name, data.price, data.image,
    data.description, data.category, 0]);
  const id = row.lastID;
  const qry = "SELECT * FROM products WHERE id LIKE ?;";
  const findRows = await db.all(qry, [id]);
  await db.close();
  return findRows;
}

/**
 * Gets an individual item from the database
 * @param {String} id - Gets information about a product
 * @return {JSON} The data on the product that's getting retrieved
 */
async function getProductInformation(id) {
  const db = await getDBConnection();
  const qry = "SELECT * FROM products WHERE id = ?;";
  const product = await db.get(qry, [id]);
  await db.close();
  return product;
}

/**
 * Gets data on a user from the database
 * @param {sqlite3.Database} db - Database that the user's data is retrieved from
 * @param {String} username - Username of the user who's data is getting retrieved
 * @return {JSON} The username and password of the user
 */
async function getUserData(db, username) {
  const qry = "SELECT username, password FROM users WHERE username LIKE ?;";
  const rows = await db.all(qry, [username]);
  return rows;
}

/**
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur should be caught in the function that calls this one.
 * @returns {sqlite3.Database} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: "husky-exchange.db",
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static("public"));
const PORT = process.env.PORT || PORT_NUMBER;
app.listen(PORT);

/**
 * This backend utilizes the brcypt API for hashing and decoding the user's password
 * https://blog.logrocket.com/password-hashing-node-js-bcrypt/
 */