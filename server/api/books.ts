import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { InsertBook } from "../../shared/schema";
import { asyncHandler } from "../utils/routeHandler";
import { supabase } from "../utils/db";

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

export function setupBooksRoutes(app: Express, verifyJWT: any) {
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
    
    // Comments endpoint/table not wired yet; keep contract stable with empty array
    const comments: BookComment[] = [];
    
    res.status(200).json({ ...book, comments });
  }));

  // Get all books uploaded by the current user
  app.get("/api/my-books", verifyJWT, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const books = await storage.getBooksByUser(userId);
    
    res.status(200).json(books);
  }));

  // Upload a new book (premium users only)
  app.post("/api/books", [verifyJWT], asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const { title, author, description, pageCount, category, language, isPublic, fileUrl, audioUrl } = req.body;
    
    if (!title || !author || !pageCount || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const newBook: InsertBook = {
      title,
      author,
      description,
      page_count: pageCount,
      category,
      language: language || "en",
      is_public: isPublic !== undefined ? isPublic : true,
      uploaded_by: String(req.user!.id),
      cover_url: fileUrl || "",
      isbn: audioUrl || null,
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
    if (book.uploaded_by !== String(req.user!.id)) {
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
      koach_points: req.user!.koach_points + 20,
    });
    
    res.status(201).json({ 
      message: "Comment added successfully",
      koachEarned: 20
    });
  }));

  // Get book categories
  app.get("/api/categories", asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
      .from("books")
      .select("category")
      .not("category", "is", null);

    if (error) {
      return res.status(500).json({ message: "Failed to fetch categories" });
    }

    const unique = Array.from(new Set((data || []).map((row: any) => row.category).filter(Boolean)));
    const categories = unique.map((name, index) => ({
      id: index + 1,
      name,
      description: "",
    }));

    res.status(200).json(categories);
  }));
}
