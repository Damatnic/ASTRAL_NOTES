import { User } from '@prisma/client';

declare module 'socket.io' {
  interface Socket {
    userId?: string;
    user?: Pick<User, 'id' | 'email' | 'username'>;
  }
}