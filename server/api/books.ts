import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isPremiumUser } from "../middleware/auth";
import { InsertBook } from "../../shared/schema";
import { asyncHandler } from "../utils/routeHandler";

// Define interfaces for better type safety
interface BookComment {
  id: number;
  bookId: number;
  userId: number;
  username: string;
  content: string;
  rating?: number;
  createdAt: string;
}

export function setupBooksRoutes(app: Express, verifyJWT: any, isPremiumUser: any) {
  // Get all books
  app.get("/api/books", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const { category, search } = req.query;
    
    let books = await storage.getBooks();
    
    // Filter by category if provided
    if (category) {
      books = books.filter(book => book.category === category);
    }
    
    // Filter by search term if provided
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      books = books.filter(
        book => book.title.toLowerCase().includes(searchTerm) || 
                book.author.toLowerCase().includes(searchTerm)
      );
    }
    
    res.status(200).json(books);
  }));

  // Get a specific book
  app.get("/api/books/:id", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const bookId = parseInt(req.params.id);
    
    if (isNaN(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }
    
    const book = await storage.getBook(bookId);
    
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    // Get comments (mock for now until API is implemented)
    const comments: BookComment[] = []; // Empty comments array with proper type
    
    res.status(200).json({ ...book, comments });
  }));

  // Get all books uploaded by the current user
  app.get("/api/my-books", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const books = await storage.getBooksByUser(userId);
    
    res.status(200).json(books);
  }));

  // Upload a new book (premium users only)
  app.post("/api/books", [verifyJWT, isPremiumUser], asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const { title, author, description, pageCount, category, language, isPublic, fileUrl, audioUrl } = req.body;
    
    if (!title || !author || !pageCount || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const newBook: InsertBook = {
      title,
      author,
      description,
      pageCount,
      category,
      language: language || "en",
      isPublic: isPublic !== undefined ? isPublic : true,
      uploadedById: req.user!.id,
      fileUrl,
      audioUrl,
    };
    
    const book = await storage.createBook(newBook);
    
    res.status(201).json(book);
  }));

  // Update a book (only by uploader)
  app.put("/api/books/:id", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }
    
    // Check if book exists
    const book = await storage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    // Check if user is the uploader
    if (book.uploadedById !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to update this book" });
    }
    
    // Update the book
    const updatedBook = await storage.updateBook(bookId, req.body);
    
    res.status(200).json(updatedBook);
  }));

  // Add a comment to a book
  app.post("/api/books/:id/comments", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }
    
    const { content, rating } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }
    
    // Check if book exists
    const book = await storage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    // TODO: Create comment in DB
    
    // Award Koach points (20 points for commenting)
    await storage.updateUser(req.user!.id, {
      koachPoints: req.user!.koachPoints + 20,
    });
    
    res.status(201).json({ 
      message: "Comment added successfully",
      koachEarned: 20
    });
  }));

  // Get book categories
  app.get("/api/categories", asyncHandler(async (req: Request, res: Response) => {
    // Temporary list of categories (in production this would come from the database)
    const categories = [
      { id: 1, name: "Fiction", description: "Fictional stories and novels" },
      { id: 2, name: "Non-Fiction", description: "Based on facts and real events" },
      { id: 3, name: "Self-Help", description: "Personal development and improvement" },
      { id: 4, name: "Fantasy", description: "Magical worlds and mythical creatures" },
      { id: 5, name: "Science Fiction", description: "Future technology and space exploration" },
      { id: 6, name: "Romance", description: "Love stories and relationships" },
      { id: 7, name: "Mystery", description: "Crime solving and suspense" },
      { id: 8, name: "Biography", description: "Life stories of real people" },
      { id: 9, name: "History", description: "Events and periods from the past" },
      { id: 10, name: "Science", description: "Scientific research and discoveries" },
      { id: 11, name: "Religion", description: "Religious texts and spiritual guidance" },
      { id: 12, name: "Children", description: "Books for young readers" },
      { id: 13, name: "Young Adult", description: "For teenage readers" },
      { id: 14, name: "Business", description: "Entrepreneurship and management" },
      { id: 15, name: "Health", description: "Wellness and medical information" },
      { id: 16, name: "Poetry", description: "Poems and verse" },
    ];
    
    res.status(200).json(categories);
  }));
}
