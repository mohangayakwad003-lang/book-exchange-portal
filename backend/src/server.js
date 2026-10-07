const express = require('express');
const path = require('path');
const { sql, poolPromise } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON bodies
app.use(express.json());

// 1. Serve frontend static assets from the sibling frontend folder
// Inside backend/src/server.js:
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// ==========================================
// REST API ROUTES
// ==========================================

// GET /api/books - Fetch all available books with the owner's name
app.get('/api/books', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        b.book_id, 
        b.title, 
        b.author, 
        b.edition, 
        b.condition, 
        b.status, 
        u.name AS owner_name
      FROM Books b
      JOIN Users u ON b.owner_id = u.user_id
      WHERE b.status = 'Available'
      ORDER BY b.created_at DESC
    `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to retrieve books from database' });
  }
});

// POST /api/books - Create a new book listing
app.post('/api/books', async (req, res) => {
  const { title, author, edition, condition, owner_id } = req.body;

  // Validation
  if (!title || !author || !owner_id) {
    return res.status(400).json({ error: 'Title, Author, and Owner ID are required.' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('title', sql.NVarChar, title)
      .input('author', sql.NVarChar, author)
      .input('edition', sql.NVarChar, edition || null)
      .input('condition', sql.NVarChar, condition || 'Good')
      .input('owner_id', sql.Int, owner_id)
      .query(`
        INSERT INTO Books (title, author, edition, condition, owner_id)
        VALUES (@title, @author, @edition, @condition, @owner_id)
      `);

    res.status(201).json({ message: 'Book listed successfully for exchange!' });
  } catch (err) {
    console.error('Error inserting book:', err);
    res.status(500).json({ error: 'Failed to list book in database' });
  }
});

// POST /api/requests - Submit a request to exchange a book
app.post('/api/requests', async (req, res) => {
  const { book_id, requester_id, offered_book_title } = req.body;

  if (!book_id || !requester_id || !offered_book_title) {
    return res.status(400).json({ error: 'Book ID, Requester ID, and Offered Book Title are required.' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('book_id', sql.Int, book_id)
      .input('requester_id', sql.Int, requester_id)
      .input('offered_book_title', sql.NVarChar, offered_book_title)
      .query(`
        INSERT INTO ExchangeRequests (book_id, requester_id, offered_book_title)
        VALUES (@book_id, @requester_id, @offered_book_title)
      `);

    res.status(201).json({ message: 'Exchange request submitted successfully!' });
  } catch (err) {
    console.error('Error submitting request:', err);
    res.status(500).json({ error: 'Failed to submit exchange request' });
  }
});

// Fallback route: Return index.html for any unhandled page paths
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});