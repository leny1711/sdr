import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import prisma from '../config/database';
import { JWTPayload } from '../types';
import { GENDER_OPTIONS, MATCH_PREFERENCE_OPTIONS } from '../constants/user.constants';

export class AuthService {
  private static SALT_ROUNDS = 10;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as string,
    } as SignOptions);
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  }

  static async register(data: {
    email: string;
    password: string;
    name: string;
    age: number;
    gender: string;
    matchPreference: string;
    city: string;
    description: string;
    photoUrl: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Cet email est déjà utilisé');
    }

    if (!data.photoUrl) {
      throw new Error('Une photo de profil est requise');
    }

    if (!GENDER_OPTIONS.includes(data.gender as (typeof GENDER_OPTIONS)[number])) {
      throw new Error('Genre invalide');
    }

    if (!MATCH_PREFERENCE_OPTIONS.includes(data.matchPreference as (typeof MATCH_PREFERENCE_OPTIONS)[number])) {
      throw new Error('Préférence de rencontre invalide');
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        gender: true,
        matchPreference: true,
        city: true,
        description: true,
        photoUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = this.generateToken({ userId: user.id, email: user.email });

    return { user, token };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Identifiants invalides');
    }

    if (!user.isActive) {
      throw new Error('Le compte est désactivé');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Identifiants invalides');
    }

    const token = this.generateToken({ userId: user.id, email: user.email });

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }
}
