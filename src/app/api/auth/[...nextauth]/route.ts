import NextAuth, { NextAuthOptions, Session, Account } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// JWT型拡張
type JWTWithAccessToken = {
	accessToken?: string;
	[key: string]: unknown;
};

// Session型拡張
export type SessionWithAccessToken = Session & {
	accessToken?: string;
};

export const authOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			authorization: {
				params: {
					scope:
						"openid email profile https://www.googleapis.com/auth/calendar.readonly",
				},
			},
		}),
	],
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async jwt({
			token,
			account,
		}: {
			token: JWTWithAccessToken;
			account?: Account | null;
		}) {
			if (account?.access_token) {
				token.accessToken = account.access_token;
			}
			return token;
		},
		async session({
			session,
			token,
		}: {
			session: SessionWithAccessToken;
			token: JWTWithAccessToken;
		}) {
			session.accessToken = token.accessToken;
			return session;
		},
	},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
