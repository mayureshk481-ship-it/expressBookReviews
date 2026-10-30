const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// ---------- Register a new user ----------
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (users.some((u) => u.username === username)) {
    return res.status(409).json({ message: "User already exists" });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// ---------- Get all books ----------
public_users.get('/', (req, res) => {
  return res.status(200).send(JSON.stringify(books, null, 4));
});

// ---------- Get book by ISBN ----------
public_users.get('/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book, null, 4));
});

// ---------- Get books by author ----------
public_users.get('/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author)
    .map((isbn) => ({ isbn, ...books[isbn] }));
  if (result.length === 0) return res.status(404).json({ message: "No books found for this author" });
  return res.status(200).send(JSON.stringify({ booksbyauthor: result }, null, 4));
});

// ---------- Get books by title ----------
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title)
    .map((isbn) => ({ isbn, ...books[isbn] }));
  if (result.length === 0) return res.status(404).json({ message: "No books found with this title" });
  return res.status(200).send(JSON.stringify({ booksbytitle: result }, null, 4));
});

// ---------- Get reviews of a book ----------
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book.reviews, null, 4));
});

// =====================================================
// Task 11: the same lookups using Axios (async/await)
// =====================================================
const getAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

const getBookByISBN = async (isbn) => {
  const response = await axios.get(`${BASE_URL}/isbn/${isbn}`);
  return response.data;
};

const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

const getBooksByTitle = async (title) => {
  const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
  return response.data;
};

// Same thing written with promise callbacks (.then / .catch)
const getAllBooksPromise = () =>
  axios.get(`${BASE_URL}/`)
    .then((response) => response.data)
    .catch((error) => console.error(error.message));

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
module.exports.getAllBooksPromise = getAllBooksPromise;