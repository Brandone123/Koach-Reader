// This is a temporary mock API service to ensure the app works with Expo Go 52+
// without requiring a functional backend server

import { AuthUser } from '../hooks/useAuth';

// Mock data types
interface Book {
  id: number;
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  pageCount: number;
  views?: number;
  totalRating?: number;
  category: string;
  language: string;
  isPublic: boolean;
  uploadedById: number;
  fileUrl?: string;
  audioUrl?: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReadingPlan {
  id: number;
  userId: number;
  bookId: number;
  title: string;
  startDate: string;
  endDate: string;
  totalPages: number;
  currentPage: number;
  frequency: 'daily' | 'weekly';
  pagesPerSession: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  book?: {
    title: string;
    author: string;
    coverImageUrl?: string;
  };
}

interface ReadingSession {
  id: number;
  userId: number;
  bookId: number;
  readingPlanId: number | null;
  pagesRead: number;
  minutesSpent: number;
  koachEarned: number;
  notes?: string;
  createdAt: string;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  requirement: string;
  points: number;
}

// Store our mock data
const mockUsers: AuthUser[] = [
  {
    id: 1,
    username: 'demo',
    email: 'demo@example.com',
    isPremium: false,
    koachPoints: 150,
    readingStreak: 5,
    preferences: {
      readingFrequency: 'daily',
      theme: 'light',
    },
    createdAt: new Date().toISOString(),
  },
];

const mockBooks: Book[] = [
  {
    id: 1,
    title: 'The Power of Habit',
    subtitle: '',
    author: 'Charles Duhigg',
    description: 'Why we do what we do in life and business. A great book about habits and how to change them.',
    pageCount: 371,
    views: 900,
    totalRating: 3,
    category: 'Self-help',
    language: 'English',
    isPublic: true,
    uploadedById: 1,
    coverImageUrl: 'https://m.media-amazon.com/images/I/51X+CgRa5vL._SY344_BO1,204,203,200_.jpg',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: 'Atomic Habits',
    subtitle: '',
    author: 'James Clear',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones.',
    pageCount: 320,
    views: 1000,
    totalRating: 5,
    category: 'Self-help',
    language: 'English',
    isPublic: true,
    uploadedById: 1,
    coverImageUrl: 'https://m.media-amazon.com/images/I/51-nXsSRfZL._SY344_BO1,204,203,200_.jpg',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    title: 'Deep Work',
    subtitle: '',
    author: 'Cal Newport',
    description: 'Rules for Focused Success in a Distracted World.',
    pageCount: 296,
    views: 300,
    totalRating: 2.5,
    category: 'Productivity',
    language: 'English',
    isPublic: true,
    uploadedById: 1,
    coverImageUrl: 'https://m.media-amazon.com/images/I/51EQlZ0jFhL._SY344_BO1,204,203,200_.jpg',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockReadingPlans: ReadingPlan[] = [
  {
    id: 1,
    userId: 1,
    bookId: 1,
    title: 'Daily Habit Reading',
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    totalPages: 371,
    currentPage: 150,
    frequency: 'daily',
    pagesPerSession: 10,
    notes: 'Read for 30 mins every morning',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    book: {
      title: 'The Power of Habit',
      author: 'Charles Duhigg',
      coverImageUrl: 'https://m.media-amazon.com/images/I/51X+CgRa5vL._SY344_BO1,204,203,200_.jpg',
    }
  },
  {
    id: 2,
    userId: 1,
    bookId: 2,
    title: 'Building Better Habits',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    totalPages: 320,
    currentPage: 85,
    frequency: 'daily',
    pagesPerSession: 8,
    notes: 'Read before bed to build habit',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    book: {
      title: 'Atomic Habits',
      author: 'James Clear',
      coverImageUrl: 'https://m.media-amazon.com/images/I/51-nXsSRfZL._SY344_BO1,204,203,200_.jpg',
    }
  },
];

const mockReadingSessions: ReadingSession[] = [
  {
    id: 1,
    userId: 1,
    bookId: 1,
    readingPlanId: 1,
    pagesRead: 20,
    minutesSpent: 35,
    koachEarned: 20,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    userId: 1,
    bookId: 1,
    readingPlanId: 1,
    pagesRead: 15,
    minutesSpent: 25,
    koachEarned: 15,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    userId: 1,
    bookId: 2,
    readingPlanId: 2,
    pagesRead: 25,
    minutesSpent: 40,
    koachEarned: 25,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockBadges: Badge[] = [
  {
    id: 1,
    name: 'First Steps',
    description: 'Completed your first reading session',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png',
    requirement: 'Complete 1 reading session',
    points: 10,
  },
  {
    id: 2,
    name: 'Bookworm',
    description: 'Read for 5 consecutive days',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3898/3898082.png',
    requirement: 'Maintain a 5-day reading streak',
    points: 50,
  },
  {
    id: 3,
    name: 'Page Turner',
    description: 'Read 500 pages total',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3227/3227053.png',
    requirement: 'Read a total of 500 pages',
    points: 100,
  },
  {
    id: 4,
    name: 'Speed Reader',
    description: 'Read over 100 pages in a single day',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2618/2618478.png',
    requirement: 'Read 100+ pages in 24 hours',
    points: 75,
  },
  {
    id: 5,
    name: 'Genre Explorer',
    description: 'Read books from 3 different categories',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png',
    requirement: 'Read books across 3 distinct genres',
    points: 50,
  },
  {
    id: 6,
    name: 'Book Completer',
    description: 'Finished your first book completely',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png',
    requirement: 'Complete a full book',
    points: 100,
  },
  {
    id: 7,
    name: 'Night Reader',
    description: 'Read at night for 7 consecutive days',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2107/2107957.png',
    requirement: 'Read between 8pm-6am for a week',
    points: 80,
  },
];

// Store our current user session
let currentUser: AuthUser | null = null;

export async function mockFetchApi(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
  } = {}
): Promise<any> {
  const { method = 'GET', body } = options;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check if endpoint contains request parameters
  const [path, queryString] = endpoint.split('?');
  const params = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};

  // Extract ID from URL if present (e.g., /api/books/1)
  const urlParts = path.split('/');
  const idFromUrl = urlParts.length > 3 ? parseInt(urlParts[3]) : null;

  // Handle API endpoints
  switch (path) {
    case '/api/login':
      if (method === 'POST') {
        const { username, password } = body;
        // In a real app, we would verify the password
        const user = mockUsers.find(u => u.username === username);
        
        if (user) {
          currentUser = user;
          return user;
        } else {
          throw new Error('Invalid username or password');
        }
      }
      break;
      
    case '/api/register':
      if (method === 'POST') {
        const { username, email, password } = body;
        // Check if user already exists
        if (mockUsers.some(u => u.username === username)) {
          throw new Error('Username already exists');
        }
        
        // Create new user
        const newUser: AuthUser = {
          id: mockUsers.length + 1,
          username,
          email,
          isPremium: false,
          koachPoints: 0,
          readingStreak: 0,
          preferences: {
            readingFrequency: 'daily',
            theme: 'light'
          },
          createdAt: new Date().toISOString(),
        };
        
        mockUsers.push(newUser);
        currentUser = newUser;
        return newUser;
      }
      break;
      
    case '/api/logout':
      currentUser = null;
      return null;
      
    case '/api/user':
      if (currentUser) {
        return currentUser;
      } else {
        throw new Error('Not logged in');
      }

    // === Books API ===
    case '/api/books':
      if (method === 'GET') {
        return mockBooks;
      } else if (method === 'POST' && currentUser) {
        const newBook: Book = {
          id: mockBooks.length + 1,
          title: body.title,
          subtitle: body.subtitle,
          author: body.author,
          description: body.description,
          pageCount: body.pageCount,
          views: body.views || 0,
          totalRating: body.totalRating || 0,
          category: body.category,
          language: body.language || 'English',
          isPublic: body.isPublic || false,
          uploadedById: currentUser.id,
          coverImageUrl: body.coverImageUrl,
          fileUrl: body.fileUrl,
          audioUrl: body.audioUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockBooks.push(newBook);
        return newBook;
      }
      break;
    
    // Get books by ID
    case `/api/books/${idFromUrl}`:
      if (method === 'GET' && idFromUrl) {
        const book = mockBooks.find(b => b.id === idFromUrl);
        if (book) {
          return book;
        } else {
          throw new Error('Book not found');
        }
      }
      break;
      
    // Get book PDF file
    case `/api/books/${idFromUrl}/file`:
      if (method === 'GET' && idFromUrl) {
        const book = mockBooks.find(b => b.id === idFromUrl);
        if (book) {
          return {
            fileUrl: 'https://www.africau.edu/images/default/sample.pdf',
            title: book.title,
            author: book.author
          };
        } else {
          throw new Error('Book file not found');
        }
      }
      break;
      
    // Get book audio file
    case `/api/books/${idFromUrl}/audio`:
      if (method === 'GET' && idFromUrl) {
        const book = mockBooks.find(b => b.id === idFromUrl);
        if (book) {
          return {
            fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            title: book.title,
            author: book.author
          };
        } else {
          throw new Error('Book audio not found');
        }
      }
      break;

    // === Reading Plans API ===
    case '/api/reading-plans':
      if (method === 'GET' && currentUser) {
        return mockReadingPlans.filter(plan => plan.userId === currentUser.id);
      } else if (method === 'POST' && currentUser) {
        const newPlan: ReadingPlan = {
          id: mockReadingPlans.length + 1,
          userId: currentUser.id,
          bookId: body.bookId,
          title: body.title,
          startDate: body.startDate,
          endDate: body.endDate,
          totalPages: body.totalPages,
          currentPage: 0,
          frequency: body.frequency || 'daily',
          pagesPerSession: body.pagesPerSession,
          notes: body.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          book: mockBooks.find(b => b.id === body.bookId) ? {
            title: mockBooks.find(b => b.id === body.bookId)!.title,
            author: mockBooks.find(b => b.id === body.bookId)!.author,
            coverImageUrl: mockBooks.find(b => b.id === body.bookId)!.coverImageUrl,
          } : undefined
        };
        mockReadingPlans.push(newPlan);
        return newPlan;
      }
      break;

    // Get reading plan by ID
    case `/api/reading-plans/${idFromUrl}`:
      if (method === 'GET' && idFromUrl && currentUser) {
        const plan = mockReadingPlans.find(p => p.id === idFromUrl && p.userId === currentUser.id);
        if (plan) {
          return plan;
        } else {
          throw new Error('Reading plan not found');
        }
      }
      break;

    // === Reading Sessions API ===
    case '/api/reading-sessions':
      if (method === 'GET' && currentUser) {
        return mockReadingSessions.filter(s => s.userId === currentUser!.id);
      } else if (method === 'POST' && currentUser) {
        const koachEarned = Math.round(body.pagesRead * 1.5);
        
        // Create new reading session
        const newSession: ReadingSession = {
          id: mockReadingSessions.length + 1,
          userId: currentUser.id,
          bookId: body.bookId,
          readingPlanId: body.readingPlanId || null,
          pagesRead: body.pagesRead,
          minutesSpent: body.minutesSpent || 0,
          koachEarned: koachEarned,
          notes: body.notes,
          createdAt: new Date().toISOString(),
        };
        
        mockReadingSessions.push(newSession);
        
        // Update reading plan progress if applicable
        if (body.readingPlanId) {
          const planIndex = mockReadingPlans.findIndex(p => p.id === body.readingPlanId);
          if (planIndex !== -1) {
            mockReadingPlans[planIndex].currentPage += body.pagesRead;
            mockReadingPlans[planIndex].updatedAt = new Date().toISOString();
          }
        }
        
        // Update user's koach points
        if (currentUser) {
          currentUser.koachPoints += koachEarned;
        }
        
        return {
          session: newSession,
          koachEarned: koachEarned
        };
      }
      break;

    // === Badges API ===
    case '/api/badges':
      if (method === 'GET') {
        return mockBadges;
      }
      break;

    case '/api/user/badges':
      if (method === 'GET' && currentUser) {
        // In a real app, we would return the badges the user has earned
        // For mock purposes, return the first 3 badges as if the user earned them
        return [
          {
            id: 1,
            userId: currentUser.id,
            badgeId: 1,
            dateEarned: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            badge: mockBadges[0]
          },
          {
            id: 2,
            userId: currentUser.id,
            badgeId: 2,
            dateEarned: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            badge: mockBadges[1]
          },
          {
            id: 3,
            userId: currentUser.id,
            badgeId: 3,
            dateEarned: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            badge: mockBadges[2]
          }
        ];
      }
      break;
      
    // Leaderboard
    case '/api/leaderboard':
      return [
        { userId: 1, username: 'demo', points: 150, rank: 1 },
        { userId: 2, username: 'bookworm42', points: 120, rank: 2 },
        { userId: 3, username: 'readaholic', points: 100, rank: 3 },
        { userId: 4, username: 'bibliophile', points: 95, rank: 4 },
        { userId: 5, username: 'kindlemaster', points: 80, rank: 5 },
        { userId: 6, username: 'speedreader', points: 75, rank: 6 },
        { userId: 7, username: 'literaryexplorer', points: 65, rank: 7 },
        { userId: 8, username: 'bookdragon', points: 55, rank: 8 },
        { userId: 9, username: 'pageturner', points: 40, rank: 9 },
        { userId: 10, username: 'wordsword', points: 30, rank: 10 },
      ];
      
    // Achievement Goals
    case '/api/goals':
      if (currentUser) {
        return [
          {
            id: 'streak7',
            name: '7-Day Streak',
            description: 'Read every day for a week',
            currentValue: currentUser.readingStreak,
            targetValue: 7,
            progress: Math.min(100, (currentUser.readingStreak / 7) * 100),
            completed: currentUser.readingStreak >= 7,
            reward: {
              type: 'badge',
              value: 1,
              badgeId: 2
            }
          },
          {
            id: 'pages500',
            name: '500 Pages',
            description: 'Read a total of 500 pages',
            currentValue: 250, // Mock value
            targetValue: 500,
            progress: 50, // 50%
            completed: false,
            reward: {
              type: 'badge',
              value: 1,
              badgeId: 3
            }
          },
          {
            id: 'sessions10',
            name: '10 Reading Sessions',
            description: 'Complete 10 reading sessions',
            currentValue: mockReadingSessions.filter(s => s.userId === currentUser.id).length,
            targetValue: 10,
            progress: Math.min(100, (mockReadingSessions.filter(s => s.userId === currentUser.id).length / 10) * 100),
            completed: mockReadingSessions.filter(s => s.userId === currentUser.id).length >= 10,
            reward: {
              type: 'points',
              value: 50
            }
          },
          {
            id: 'books3',
            name: '3 Books',
            description: 'Finish 3 different books',
            currentValue: 1,
            targetValue: 3,
            progress: 33.33,
            completed: false,
            reward: {
              type: 'badge',
              value: 1,
              badgeId: 6
            }
          },
        ];
      }
      return [];
      
    // Reading Stats
    case '/api/stats':
      if (currentUser) {
        return {
          daysActive: 12,
          totalReadingTime: 465, // minutes
          totalPagesRead: 250,
          booksStarted: 3,
          booksCompleted: 1,
          averagePagesPerDay: 20.8,
          averageTimePerDay: 38.75, // minutes
          currentStreak: currentUser.readingStreak,
          longestStreak: Math.max(currentUser.readingStreak, 7),
          preferredReadingTime: '8:00 PM',
          mostReadCategory: 'Self-help',
          readingByDay: [
            { day: 'Monday', pagesRead: 35 },
            { day: 'Tuesday', pagesRead: 28 },
            { day: 'Wednesday', pagesRead: 42 },
            { day: 'Thursday', pagesRead: 15 },
            { day: 'Friday', pagesRead: 30 },
            { day: 'Saturday', pagesRead: 55 },
            { day: 'Sunday', pagesRead: 45 }
          ],
          readingByTime: [
            { time: 'Morning', percentage: 15 },
            { time: 'Afternoon', percentage: 25 },
            { time: 'Evening', percentage: 45 },
            { time: 'Night', percentage: 15 }
          ]
        };
      }
      return {};
      
    // === Challenges API ===
    case '/api/challenges':
      if (method === 'GET') {
        return [
          {
            id: 1,
            title: "30-Day Reading Challenge",
            description: "Read every day for 30 days and track your progress!",
            creatorId: 2,
            startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            goal: 500,
            goalType: "pages",
            isPrivate: false,
            participantCount: 8,
            myProgress: currentUser ? 220 : undefined,
            status: currentUser ? "active" : undefined,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            title: "Summer Book Club",
            description: "Read 3 books from our summer reading list",
            creatorId: 3,
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            goal: 3,
            goalType: "books",
            isPrivate: false,
            participantCount: 12,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            title: "Speed Reading Practice",
            description: "Track your reading speed and improve over time",
            creatorId: 5,
            startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            goal: 1000,
            goalType: "minutes",
            isPrivate: false,
            participantCount: 5,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
      } else if (method === 'POST' && currentUser) {
        // Create a new challenge
        return {
          id: 4,
          title: body.title,
          description: body.description,
          creatorId: currentUser.id,
          startDate: body.startDate,
          endDate: body.endDate,
          goal: body.goal,
          goalType: body.goalType,
          isPrivate: !!body.isPrivate,
          participantCount: 1,
          myProgress: 0,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      break;
      
    // Get challenge details by ID
    case `/api/challenges/${idFromUrl}`:
      if (method === 'GET' && idFromUrl) {
        return {
          id: idFromUrl,
          title: "30-Day Reading Challenge",
          description: "Read every day for 30 days and track your progress!",
          creatorId: 2,
          creatorName: "bookworm42",
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          goal: 500,
          goalType: "pages",
          isPrivate: false,
          participantCount: 8,
          myProgress: currentUser ? 220 : undefined,
          status: currentUser ? "active" : undefined,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        };
      }
      break;
      
    // Get challenge participants
    case `/api/challenges/${idFromUrl}/participants`:
      if (method === 'GET' && idFromUrl) {
        return [
          {
            id: 1,
            userId: currentUser ? currentUser.id : 1,
            username: currentUser ? currentUser.username : "demo",
            challengeId: idFromUrl,
            progress: 220,
            progressPercentage: 44,
            status: "active",
            joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            userId: 2,
            username: "bookworm42",
            challengeId: idFromUrl,
            progress: 350,
            progressPercentage: 70,
            status: "active",
            joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            userId: 3,
            username: "readaholic",
            challengeId: idFromUrl,
            progress: 500,
            progressPercentage: 100,
            status: "completed",
            joinedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 4,
            userId: 4,
            username: "bibliophile",
            challengeId: idFromUrl,
            progress: 320,
            progressPercentage: 64,
            status: "active",
            joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 5,
            userId: 5,
            username: "kindlemaster",
            challengeId: idFromUrl,
            progress: 180,
            progressPercentage: 36,
            status: "active",
            joinedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
      }
      break;
      
    // Update challenge progress
    case `/api/challenges/${idFromUrl}/progress`:
      if (method === 'POST' && idFromUrl && currentUser) {
        return {
          success: true,
          message: "Progress updated successfully"
        };
      }
      break;
      
    // Join a challenge
    case `/api/challenges/${idFromUrl}/join`:
      if (method === 'POST' && idFromUrl && currentUser) {
        return {
          success: true,
          message: "Joined challenge successfully"
        };
      }
      break;
      
    // Challenge comments
    case `/api/challenges/${idFromUrl}/comments`:
      if (method === 'GET' && idFromUrl) {
        return [
          {
            id: 1,
            userId: 2,
            username: "bookworm42",
            challengeId: idFromUrl,
            content: "Let's all try to read daily and support each other!",
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            userId: 3,
            username: "readaholic",
            challengeId: idFromUrl,
            content: "Just finished! It was a great challenge, thanks for organizing!",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            userId: 5,
            username: "kindlemaster",
            challengeId: idFromUrl,
            content: "I'm finding it harder than expected, but I'm not giving up!",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
      } else if (method === 'POST' && idFromUrl && currentUser) {
        return {
          id: 4,
          userId: currentUser.id,
          username: currentUser.username,
          challengeId: idFromUrl,
          content: body.content,
          createdAt: new Date().toISOString()
        };
      }
      break;
      
    default:
      console.log(`Mock API endpoint not implemented: ${path}`);
      return [];
  }
}