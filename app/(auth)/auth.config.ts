import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role; // Assuming the role is stored in auth.user.role

      const isOnChat = nextUrl.pathname.startsWith('/');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      if (isLoggedIn) {
        if (isOnLogin || isOnRegister) {
          if (userRole === 'admin') {
            return Response.redirect(new URL('/dashboard', nextUrl as unknown as URL));
          } else if (userRole === 'moderator') {
            return Response.redirect(new URL('/', nextUrl as unknown as URL));
          }
        }

        if (isOnChat && userRole === 'admin') {
          return Response.redirect(new URL('/dashboard', nextUrl as unknown as URL));
        }

        return true;
      }

      if (isOnRegister || isOnLogin) {
        return true; // Allow access to register and login pages
      }

      return Response.redirect(new URL('/login', nextUrl as unknown as URL)); // Redirect unauthenticated users
    },
  },
} satisfies NextAuthConfig;
