import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()
  const validToken = process.env.ADMIN_TOKEN || 'turanos2026'

  if (password !== validToken) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', validToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 дней
  })
  return res
}
