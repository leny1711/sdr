import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import prisma from '../config/database';
import { JWTPayload } from '../types';
import { GENDER_OPTIONS, INTEREST_OPTIONS } from '../constants/user.constants';
import { buildFullName, splitFullName } from '../utils/name.utils';
import { normalizePhotoUrl } from '../utils/reveal.utils';

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
    firstName?: string;
    lastName?: string;
    name?: string;
    age: number;
    gender: string;
    interestedIn: string[];
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

    if (
      !Array.isArray(data.interestedIn) ||
      data.interestedIn.length === 0 ||
      !data.interestedIn.every((value) => INTEREST_OPTIONS.includes(value as (typeof INTEREST_OPTIONS)[number]))
    ) {
      throw new Error('Préférences de rencontre invalides');
    }

    const hashedPassword = await this.hashPassword(data.password);

    const { firstName, lastName, name, ...rest } = data;
    const fullName = buildFullName(firstName, lastName, name);
    if (!fullName) {
      throw new Error('Le nom complet est requis');
    }

    const user = await prisma.user.create({
      data: {
        ...rest,
        name: fullName,
        password: hashedPassword,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        gender: true,
        interestedIn: true,
        city: true,
        description: true,
        photoUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = this.generateToken({ userId: user.id, email: user.email });
    const normalizedPhoto = normalizePhotoUrl(user.photoUrl);

    return {
      user: {
        ...user,
        ...splitFullName(fullName),
        photoUrl: normalizedPhoto,
        photoHidden: !normalizedPhoto,
      },
      token,
    };
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
    const normalizedPhoto = normalizePhotoUrl(userWithoutPassword.photoUrl);

    const { firstName, lastName } = splitFullName(userWithoutPassword.name);

    return {
      user: {
        ...userWithoutPassword,
        photoUrl: normalizedPhoto,
        photoHidden: !normalizedPhoto,
        firstName,
        lastName,
      },
      token,
    };
  }
}
