const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Base address of this same server (used by the Axios calls below)
const baseUrl = (req) => `http://127.0.0.1:${req.socket.localPort}`;

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

// =====================================================
// Data endpoints: return the book data as JSON.
// The public routes further down fetch these with Axios.
// =====================================================
public_users.get('/data/books', (req, res) => {
  return res.status(200).json(books);
});

public_users.get('/data/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).json(book);
});

public_users.get('/data/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author)
    .map((isbn) => ({ isbn, ...books[isbn] }));
  if (result.length === 0) return res.status(404).json({ message: "No books found for this author" });
  return res.status(200).json({ booksbyauthor: result });
});

public_users.get('/data/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title)
    .map((isbn) => ({ isbn, ...books[isbn] }));
  if (result.length === 0) return res.status(404).json({ message: "No books found with this title" });
  return res.status(200).json({ booksbytitle: result });
});

// Send an Axios error back to the client in a clean way
const sendError = (res, error) => {
  const status = error.response ? error.response.status : 500;
  const message = error.response ? error.response.data : { message: error.message };
  return res.status(status).json(message);
};

// ---------- Get all books (Axios + async/await) ----------
public_users.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${baseUrl(req)}/data/books`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return sendError(res, error);
  }
});

// ---------- Get book by ISBN (Axios + async/await) ----------
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const response = await axios.get(`${baseUrl(req)}/data/isbn/${encodeURIComponent(req.params.isbn)}`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return sendError(res, error);
  }
});

// ---------- Get books by author (Axios + promise callbacks) ----------
public_users.get('/author/:author', (req, res) => {
  axios.get(`${baseUrl(req)}/data/author/${encodeURIComponent(req.params.author)}`)
    .then((response) => res.status(200).send(JSON.stringify(response.data, null, 4)))
    .catch((error) => sendError(res, error));
});

// ---------- Get books by title (Axios + promise callbacks) ----------
public_users.get('/title/:title', (req, res) => {
  axios.get(`${baseUrl(req)}/data/title/${encodeURIComponent(req.params.title)}`)
    .then((response) => res.status(200).send(JSON.stringify(response.data, null, 4)))
    .catch((error) => sendError(res, error));
});

// ---------- Get reviews of a book ----------
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book.reviews, null, 4));
});

module.exports.general = public_users;