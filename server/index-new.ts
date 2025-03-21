import { createServer } from "http";
import { storage } from "./storage";

// Simple HTTP server without Express
const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Set content type
  res.setHeader('Content-Type', 'application/json');

  // Basic routing
  const url = req.url || '/';
  const method = req.method || 'GET';
  
  console.log(`${method} ${url}`);

  // Health check endpoint
  if (url === '/health' && method === 'GET') {
    try {
      // Check database connection
      await storage.getBooks();
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok' }));
    } catch (error) {
      console.error('Health check failed:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ status: 'error', message: 'Database connection failed' }));
    }
    return;
  }

  // Books endpoints
  if (url === '/api/books' && method === 'GET') {
    try {
      const books = await storage.getBooks();
      res.writeHead(200);
      res.end(JSON.stringify(books));
    } catch (error) {
      console.error('Error fetching books:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to fetch books' }));
    }
    return;
  }

  // Not found
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;