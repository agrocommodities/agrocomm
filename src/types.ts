export interface User {
  user: {
    id: number;
    email: string;
    role: string;
    name?: string | null;
    username?: string | null;
  } | null;
}