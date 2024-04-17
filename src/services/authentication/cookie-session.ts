import { unsealData, sealData } from 'iron-session';
import { cookies } from 'next/headers';

const sessionPassword = process.env.SESSION_PASSWORD as string;
if (!sessionPassword) throw new Error('SESSION_PASSWORD is not set');

export type User = {
    userId: number;
    userWalletAddress: string;
};

export async function getSession(): Promise<User | null> {
    const encryptedSession = cookies().get('auth_session')?.value;

    const session = encryptedSession
        ? ((await unsealData(encryptedSession, {
              password: sessionPassword
          })) as string)
        : null;

    return session ? (JSON.parse(session) as User) : null;
}

export async function setSession(user: User): Promise<void> {
    const encryptedSession = await sealData(JSON.stringify(user), {
        password: sessionPassword
    });

    cookies().set('auth_session', encryptedSession, {
        sameSite: 'strict',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365, // One year
        path: '/'
    });
}
