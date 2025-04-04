// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const userId = request.cookies.get('userId')?.value;
  
  // Protected paths that require authentication
  const protectedPaths = [
    '/cart',
    '/checkout',
    '/profile',
    '/add-product'
  ];
  
  const path = request.nextUrl.pathname;
  
  // Check if the path is protected and user is not logged in
  if (protectedPaths.some(prefix => path.startsWith(prefix)) && !userId) {
    const url = new URL('/Login', request.url);
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }
  
  // Public paths that should redirect to dashboard if user is logged in
  const publicAuthPaths = ['/Login', '/Register'];
  
  if (publicAuthPaths.includes(path) && userId) {
    return NextResponse.redirect(new URL('/products', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/cart',
    '/checkout',
    '/profile',
    '/add-product',
    '/Login',
    '/Register'
  ],
};