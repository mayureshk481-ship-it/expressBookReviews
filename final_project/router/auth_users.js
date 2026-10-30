const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Is the username already taken?
const isValid = (username) => users.some((u) => u.username === username);

// Do username and password match a registered user?
const authenticatedUser = (username, password) =>
  users.some((u) => u.username === username && u.password === password);

// ---------- Login ----------
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login. Check username and password" });
  }
  const accessToken = jwt.sign({ data: password }, 'access', { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({ message: "User successfully logged in" });
});

// ---------- Add or modify a review ----------
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;
  if (!books[isbn]) return res.status(404).json({ message: "Book not found" });
  if (!review) return res.status(400).json({ message: "Please provide a review" });
  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: `Review for book ${isbn} added/updated successfully`,
    reviews: books[isbn].reviews,
  });
});

// ---------- Delete your review ----------
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;
  if (!books[isbn]) return res.status(404).json({ message: "Book not found" });
  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: "You have no review for this book" });
  }
  delete books[isbn].reviews[username];
  return res.status(200).json({ message: `Review for book ${isbn} deleted successfully` });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;