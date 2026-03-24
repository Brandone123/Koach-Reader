export interface CreateReadingPlanInput {
  userId: string;
  bookId: number;
  startDate: string;
  endDate: string;
  dailyGoal: number;
  notes?: string;
}

export interface LogReadingSessionInput {
  bookId: number;
  readingPlanId?: number;
  pagesRead: number;
  minutesSpent?: number;
  notes?: string;
}

export function toCreateReadingPlanPayload(input: CreateReadingPlanInput) {
  return {
    user_id: input.userId,
    book_id: input.bookId,
    startDate: input.startDate,
    endDate: input.endDate,
    dailyGoal: input.dailyGoal,
    notes: input.notes,
  };
}

export function toLogReadingSessionPayload(input: LogReadingSessionInput) {
  return {
    book_id: input.bookId,
    reading_plan_id: input.readingPlanId,
    pagesRead: input.pagesRead,
    minutesSpent: input.minutesSpent,
    notes: input.notes,
  };
}
