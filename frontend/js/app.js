const booksGrid = document.getElementById('booksGrid');
const addBookForm = document.getElementById('addBookForm');

document.addEventListener('DOMContentLoaded', fetchBooks);

async function fetchBooks() {
  try {
    const res = await fetch('/api/books');
    const books = await res.json();

    booksGrid.innerHTML = '';
    if (!books.length) {
      booksGrid.innerHTML = '<p>No books currently available for exchange.</p>';
      return;
    }

    books.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';
      card.innerHTML = `
        <div>
          <h3>${escapeHtml(book.title)}</h3>
          <p><strong>Author:</strong> ${escapeHtml(book.author)}</p>
          <p><strong>Edition:</strong> ${escapeHtml(book.edition || 'N/A')}</p>
          <p><strong>Condition:</strong> ${escapeHtml(book.condition)}</p>
          <p><strong>Owner:</strong> ${escapeHtml(book.owner_name)}</p>
        </div>
        <button onclick="requestExchange(${book.book_id})">Request Exchange</button>
      `;
      booksGrid.appendChild(card);
    });
  } catch (err) {
    booksGrid.innerHTML = '<p>Failed to load books. Please check backend connection.</p>';
  }
}

addBookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('title').value,
    author: document.getElementById('author').value,
    edition: document.getElementById('edition').value,
    condition: document.getElementById('condition').value,
    owner_id: parseInt(document.getElementById('owner_id').value, 10)
  };

  const res = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert('Book listed successfully!');
    addBookForm.reset();
    fetchBooks();
  } else {
    alert('Failed to list book.');
  }
});

async function requestExchange(bookId) {
  const offeredTitle = prompt('Which book will you offer in return?');
  if (!offeredTitle) return;

  const requesterId = prompt('Enter your Student ID:');
  if (!requesterId) return;

  const res = await fetch('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      book_id: bookId,
      requester_id: parseInt(requesterId, 10),
      offered_book_title: offeredTitle
    })
  });

  if (res.ok) {
    alert('Exchange request sent to the owner!');
  } else {
    alert('Failed to send exchange request.');
  }
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}