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
  
  // Reading plan properties
  bookId?: number;
  startDate?: string;
  endDate?: string;
  frequency?: 'daily' | 'weekly';
  pagesPerSession?: number;
  notes?: string;
  
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
            pageCount: body.pageCount || 0,
            category: body.category || 'General',
            description: body.description || null,
            language: body.language || 'English',
            isPublic: typeof body.isPublic === 'boolean' ? body.isPublic : true,
            uploadedById: body.uploadedById || 1, // Default to user 1 for now
            fileUrl: body.fileUrl || null,
            audioUrl: body.audioUrl || null,
            coverUrl: body.coverImageUrl || null
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
      // GET /api/reading-plans - Get all reading plans for the current user
      if (!params.id && method === 'GET') {
        try {
          // For now, hard-code user ID 1 as we don't have authentication yet
          const userId = 1;  
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
          if (!body.bookId || !body.startDate || !body.endDate) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Book ID, start date, and end date are required' }));
            return;
          }
          
          // For now, hard-code user ID 1
          const userId = 1;
          
          // Convertir les chaînes de date en objets Date
          const startDate = new Date(body.startDate);
          const endDate = new Date(body.endDate);
          
          // Construire le plan de lecture en fonction du schéma actuel de la base de données
          const readingPlanToCreate = {
            userId: userId,
            bookId: Number(body.bookId),
            startDate: startDate,
            endDate: endDate,
            frequency: body.frequency || 'daily',
            pagesPerSession: body.pagesPerSession || 10,
            title: body.title || `Plan de lecture: ${body.bookId}`,
            total_pages: body.totalPages || 100,
            current_page: 0,
            notes: body.notes || ''
          };
          
          // Utiliser la méthode createReadingPlanSimple qui évite les problèmes de schéma
          const newPlan = await storage.createReadingPlanSimple(readingPlanToCreate);
          
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
    else if (resourceType === 'register' && method === 'POST') {
      try {
        // Basic validation
        if (!body.username || !body.email || !body.password) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Username, email, and password are required' }));
          return;
        }
        
        // Check if username already exists
        const existingUser = await storage.getUserByUsername(body.username);
        if (existingUser) {
          res.writeHead(409);
          res.end(JSON.stringify({ error: 'Username already exists' }));
          return;
        }
        
        // Check if email already exists
        const existingEmail = await storage.getUserByEmail(body.email);
        if (existingEmail) {
          res.writeHead(409);
          res.end(JSON.stringify({ error: 'Email already in use' }));
          return;
        }
        
        // Hash password
        const hashedPassword = await hashPassword(body.password);
        
        // Create user
        const userToCreate: InsertUser = {
          username: body.username,
          email: body.email,
          password: hashedPassword,
          firstName: body.firstName || null,
          lastName: body.lastName || null,
          profilePicUrl: body.profilePicUrl || null,
          koachPoints: 0,
          isPremium: false,
          preferences: {} 
        };
        
        const user = await storage.createUser(userToCreate);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        res.writeHead(201);
        res.end(JSON.stringify(userWithoutPassword));
      } catch (error) {
        console.error('Error registering user:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Registration failed' }));
      }
      return;
    }
    
    else if (resourceType === 'login' && method === 'POST') {
      try {
        // Basic validation
        if (!body.username || !body.password) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Username and password are required' }));
          return;
        }
        
        // Find user
        const user = await storage.getUserByUsername(body.username);
        if (!user) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }
        
        // Verify password
        const passwordMatch = await comparePasswords(body.password, user.password);
        if (!passwordMatch) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        res.writeHead(200);
        res.end(JSON.stringify({
          user: userWithoutPassword,
          message: 'Login successful'
        }));
      } catch (error) {
        console.error('Error logging in:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Login failed' }));
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
      
      // GET /api/badges/user - Get badges for current user
      if (method === 'GET' && url.includes('/api/badges/user')) {
        try {
          // For now, hard-code user ID 1
          const userId = 1;
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