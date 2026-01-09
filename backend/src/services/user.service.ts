import prisma from '../config/database';
import { GENDER_OPTIONS, INTEREST_OPTIONS } from '../constants/user.constants';
import { splitFullName, buildFullName } from '../utils/name.utils';

export class UserService {
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    const { firstName, lastName } = splitFullName(user.name);

    return {
      ...user,
      firstName,
      lastName,
    };
  }

  static async updateProfile(userId: string, data: {
    name?: string;
    firstName?: string;
    lastName?: string;
    age?: number;
    gender?: string;
    interestedIn?: string[];
    city?: string;
    description?: string;
    photoUrl?: string;
  }) {
    const { firstName, lastName, ...rest } = data;
    const payload = { ...rest };

    if (!payload.name && (firstName || lastName)) {
      payload.name = buildFullName(firstName, lastName);
    }

    if (payload.gender && !GENDER_OPTIONS.includes(payload.gender as (typeof GENDER_OPTIONS)[number])) {
      throw new Error('Genre invalide');
    }

    if (payload.interestedIn !== undefined) {
      if (
        !Array.isArray(payload.interestedIn) ||
        payload.interestedIn.length === 0 ||
        !payload.interestedIn.every((value) =>
          INTEREST_OPTIONS.includes(value as (typeof INTEREST_OPTIONS)[number])
        )
      ) {
        throw new Error('Préférences de rencontre invalides');
      }
      payload.interestedIn = Array.from(new Set(payload.interestedIn));
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: payload,
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

    const { firstName: parsedFirstName, lastName: parsedLastName } = splitFullName(user.name);

    return {
      ...user,
      firstName: parsedFirstName,
      lastName: parsedLastName,
    };
  }

  static async deactivateAccount(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  static async deleteAccount(userId: string) {
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}
