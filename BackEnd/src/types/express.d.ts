declare global {
  namespace Express {
    interface UserContext {
      id: string;
    }

    interface Request {
      user?: UserContext;
    }
  }
}

export {};