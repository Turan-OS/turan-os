import { NextResponse } from 'next/server'

export async function GET() {
  const res = NextResponse.redirect(new URL('/admin/login', 'http://localhost'))
  res.cookies.set('admin_token', '', { maxAge: 0 })
  return res
}
