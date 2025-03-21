/**
 * A utility wrapper for Express route handlers to properly handle async functions
 * This solves TypeScript "Promise<void>" return type issues
 */
export function asyncHandler(fn: Function) {
  return function(req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}