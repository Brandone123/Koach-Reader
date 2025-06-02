import dotenv from "dotenv";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords } from "./utils/auth";
import { 
  type User, 
  type InsertUser, 
  type Book, 
  type InsertBook, 
  type ReadingPlan,
  type InsertReadingPlan
} from "../shared/schema";

dotenv.config();
// Define interface types for our application
interface RequestBody {
  // User registration/login
  username?: string;
  email?: string;
  password?: string;
  
  // Book properties
  title?: string;
  author?: string;
  description?: string;
  pageCount?: number;
  category?: string;
  language?: string;
  isPublic?: boolean;
  uploadedById?: number;
  fileUrl?: string;
  audioUrl?: string;
  coverImageUrl?: string;
  isbn?: string;
  
  // Reading plan properties
  bookId?: number;
  startDate?: string;
  endDate?: string;
  frequency?: 'daily' | 'weekly';
  pagesPerSession?: number;
  notes?: string;
  totalPages?: number;
  
  // Other common properties
  [key: string]: any;
}

interface RequestParams {
  id?: number;
  [key: string]: any;
}

// Helper function to parse JSON body from request
const parseRequestBody = async (req: any): Promise<RequestBody> => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        console.error('Error parsing request body:', error);
        resolve({});
      }
    });
  });
};

// Helper function to extract URL parameters
const getUrlParams = (url: string): { pathSegments: string[], params: RequestParams } => {
  const [path, query] = url.split('?');
  const params: RequestParams = {};
  const pathSegments = path.split('/').filter(segment => segment.length > 0);
  
  // Extract ID from URL path like /api/books/123
  if (pathSegments.length > 2) {
    params.id = parseInt(pathSegments[2], 10);
  }

  // Parse query parameters
  if (query) {
    query.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key) params[key] = value;
    });
  }

  return { pathSegments, params };
};

// Simple HTTP server without Express
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
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

  // Extract path and parameters
  const { pathSegments, params } = getUrlParams(url);
  const baseRoute = pathSegments.length > 0 ? `/${pathSegments[0]}` : '/';
  const resourceType = pathSegments.length > 1 ? pathSegments[1] : '';
  
  // Parse request body for non-GET requests
  let body: RequestBody = {};
  if (method !== 'GET') {
    body = await parseRequestBody(req);
  }

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

  // API routes
  if (baseRoute === '/api') {
    // Books endpoints
    if (resourceType === 'books') {
      // GET /api/books - Get all books
      if (!params.id && method === 'GET') {
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
      
      // GET /api/books/:id - Get a specific book
      if (params.id && method === 'GET') {
        try {
          const book = await storage.getBook(params.id);
          if (book) {
            res.writeHead(200);
            res.end(JSON.stringify(book));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Book not found' }));
          }
        } catch (error) {
          console.error(`Error fetching book ${params.id}:`, error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to fetch book' }));
        }
        return;
      }
      
      // POST /api/books - Create a new book
      if (!params.id && method === 'POST') {
        try {
          // Basic validation
          if (!body.title || !body.author) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Title and author are required' }));
            return;
          }
          
          // Assurez-vous que les propriétés obligatoires sont définies
          const bookToCreate: InsertBook = {
            title: body.title,
            author: body.author,
            description: body.description || '',
            page_count: body.pageCount || 0,
            category: body.category || 'General',
            language: body.language || 'en',
            is_public: typeof body.isPublic === 'boolean' ? body.isPublic : true,
            uploaded_by: body.uploadedById?.toString() || '1',
            cover_url: body.coverImageUrl || '',
            isbn: body.isbn || null
          };
          
          const newBook = await storage.createBook(bookToCreate);
          res.writeHead(201);
          res.end(JSON.stringify(newBook));
        } catch (error) {
          console.error('Error creating book:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to create book' }));
        }
        return;
      }
    }
    
    // Reading plans endpoints
    else if (resourceType === 'reading-plans') {
      // GET /api/users/:id/reading-plans
      if (pathSegments[2] && pathSegments[3] === 'reading-plans' && method === 'GET') {
        try {
          const userId = pathSegments[2];  // Already a string
          const plans = await storage.getReadingPlansByUser(userId);
          res.writeHead(200);
          res.end(JSON.stringify(plans));
        } catch (error) {
          console.error('Error fetching reading plans:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to fetch reading plans' }));
        }
        return;
      }
      
      // GET /api/reading-plans/:id - Get a specific reading plan
      if (params.id && method === 'GET') {
        try {
          const plan = await storage.getReadingPlan(params.id);
          if (plan) {
            res.writeHead(200);
            res.end(JSON.stringify(plan));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Reading plan not found' }));
          }
        } catch (error) {
          console.error(`Error fetching reading plan ${params.id}:`, error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to fetch reading plan' }));
        }
        return;
      }
      
      // POST /api/reading-plans - Create a new reading plan
      if (!params.id && method === 'POST') {
        try {
          // Basic validation
          if (!body.userId || !body.bookId || !body.startDate || !body.endDate) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'User ID, Book ID, start date, and end date are required' }));
            return;
          }

          const readingPlanToCreate: InsertReadingPlan = {
            user_id: body.userId.toString(),
            book_id: Number(body.bookId),
            title: body.title || `Reading Plan for Book ${body.bookId}`,
            start_date: new Date(body.startDate).toISOString(),
            end_date: new Date(body.endDate).toISOString(),
            frequency: body.frequency || 'daily',
            pages_per_session: Number(body.pagesPerSession) || 10,
            total_pages: Number(body.totalPages) || 0,
            current_page: 0,
            notes: body.notes || null
          };

          const newPlan = await storage.createReadingPlan(readingPlanToCreate);
          res.writeHead(201);
          res.end(JSON.stringify(newPlan));
        } catch (error) {
          console.error('Error creating reading plan:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to create reading plan' }));
        }
        return;
      }
    }
    
    // User authentication endpoints
    else if (resourceType === 'auth' && pathSegments[2] === 'register' && method === 'POST') {
      try {
        // Basic validation
        if (!body.email || !body.username || !body.password) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Email, username and password are required' }));
          return;
        }

        const hashedPassword = await hashPassword(body.password as string);
        const userToCreate: InsertUser = {
          email: body.email,
          username: body.username,
          is_premium: false,
          koach_points: 0,
          reading_streak: 0,
          preferences: {},
          last_login: null,
          avatar_url: null
        };

        const user = await storage.createUser(userToCreate);
        const userWithoutPassword = { ...user };
        res.writeHead(201);
        res.end(JSON.stringify(userWithoutPassword));
      } catch (error) {
        console.error('Error registering user:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to register user' }));
      }
      return;
    }
    
    else if (resourceType === 'auth' && pathSegments[2] === 'login' && method === 'POST') {
      try {
        // Basic validation
        if (!body.email) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Email is required' }));
          return;
        }

        const user = await storage.getUserByEmail(body.email);
        if (!user) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }

        // Puisque nous utilisons Supabase Auth, nous n'avons plus besoin de vérifier le mot de passe ici
        const userWithoutPassword = { ...user };
        res.writeHead(200);
        res.end(JSON.stringify(userWithoutPassword));
      } catch (error) {
        console.error('Error logging in:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to log in' }));
      }
      return;
    }

    // Badges endpoints
    else if (resourceType === 'badges') {
      // GET /api/badges - Get all badges
      if (method === 'GET' && !params.id) {
        try {
          const badges = await storage.getBadges();
          res.writeHead(200);
          res.end(JSON.stringify(badges));
        } catch (error) {
          console.error('Error fetching badges:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to fetch badges' }));
        }
        return;
      }
      
      // GET /api/users/:id/badges - Get user badges
      if (pathSegments[2] && pathSegments[3] === 'badges' && method === 'GET') {
        try {
          const userId = pathSegments[2];  // Already a string
          const userBadges = await storage.getUserBadges(userId);
          res.writeHead(200);
          res.end(JSON.stringify(userBadges));
        } catch (error) {
          console.error('Error fetching user badges:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to fetch user badges' }));
        }
        return;
      }
    }
  }

  // Not found for any other routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;