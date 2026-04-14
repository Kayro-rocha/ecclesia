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

        console.log('Tentando login:', credentials.email)

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        console.log('Usuário encontrado:', user ? 'sim' : 'não')

        if (!user) return null

        console.log('Hash no banco:', user.password)
        console.log('Senha digitada:', credentials.password)

        const validPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        console.log('Senha válida:', validPassword)

        if (!validPassword) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          churchId: user.churchId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.churchId = (user as any).churchId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = token.role
          ; (session.user as any).churchId = token.churchId
          ; (session.user as any).id = token.sub
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
