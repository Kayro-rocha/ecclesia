import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        slug: { label: 'Slug', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const validPassword = await bcrypt.compare(credentials.password, user.password)
        if (!validPassword) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          churchId: user.churchId,
          permissions: user.permissions ? JSON.parse(user.permissions) : null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.churchId = (user as any).churchId
        token.permissions = (user as any).permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = token.role
        ;(session.user as any).churchId = token.churchId
        ;(session.user as any).id = token.sub
        ;(session.user as any).permissions = token.permissions
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
