import prisma from '../config/database';
import { MessageType } from '@prisma/client';
import { ChapterNumber, MessageEnvelope, RevealLevel, SystemMessagePayload } from '../types';
import { computeRevealLevel, getChapterSystemLabel } from '../utils/reveal.utils';

export class MessageService {
  private static conversationLocks = new Map<string, Promise<void>>();
  private static lastMessageTimestamps = new Map<string, number>();
  private static readonly MIN_MESSAGE_INTERVAL_MS = 400;

  private static async withConversationLock<T>(conversationId: string, task: () => Promise<T>): Promise<T> {
    const previous = this.conversationLocks.get(conversationId) ?? Promise.resolve();
    let release: () => void = () => {};
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = previous.then(() => current);
    this.conversationLocks.set(conversationId, chained);
    await previous;
    try {
      return await task();
    } finally {
      release();
      if (this.conversationLocks.get(conversationId) === chained) {
        this.conversationLocks.delete(conversationId);
      }
    }
  }

  private static async enforceRateLimit(conversationId: string) {
    const now = Date.now();
    const last = this.lastMessageTimestamps.get(conversationId) ?? 0;
    const delta = now - last;
    if (delta < this.MIN_MESSAGE_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, this.MIN_MESSAGE_INTERVAL_MS - delta));
    }
    this.lastMessageTimestamps.set(conversationId, Date.now());
  }

  static async sendTextMessage(conversationId: string, senderId: string, content: string): Promise<MessageEnvelope> {
    return this.withConversationLock(conversationId, async () => {
      await this.enforceRateLimit(conversationId);
      const result = await prisma.$transaction(async (tx) => {
        const conversation = await tx.conversation.findUnique({
          where: { id: conversationId },
          select: {
            id: true,
            user1Id: true,
            user2Id: true,
            textMessageCount: true,
            revealLevel: true,
            chapter1UnlockedAt: true,
            chapter2UnlockedAt: true,
            chapter3UnlockedAt: true,
            chapter4UnlockedAt: true,
          },
        });

        if (!conversation) {
          throw new Error('Conversation not found');
        }

        if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
          throw new Error('Unauthorized access to conversation');
        }

        const currentCount = conversation.textMessageCount;
        const nextTextCount = currentCount + 1;
        const previousReveal = conversation.revealLevel ?? computeRevealLevel(currentCount);
        const computedReveal = computeRevealLevel(nextTextCount);
        const nextRevealLevel = Math.min(Math.max(previousReveal, computedReveal), 4) as ChapterNumber;
        const chapterChanged = nextRevealLevel !== previousReveal;
        const newlyUnlocked: ChapterNumber[] = [];

        const message = await tx.message.create({
          data: {
            conversationId,
            senderId,
            type: MessageType.TEXT,
            content,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        const conversationUpdateData: any = {
          textMessageCount: {
            increment: 1,
          },
          revealLevel: nextRevealLevel,
          updatedAt: new Date(),
        };

        if (nextRevealLevel > previousReveal) {
          const unlockTime = new Date(message.createdAt.getTime() + 1);
          for (let level = Math.max(previousReveal + 1, 1); level <= nextRevealLevel; level++) {
            const key = `chapter${level}UnlockedAt` as keyof typeof conversation;
            if (!conversation[key]) {
              conversationUpdateData[key] = unlockTime;
              newlyUnlocked.push(level as ChapterNumber);
            }
          }
        }

        const updatedConversation = await tx.conversation.update({
          where: { id: conversationId },
          data: conversationUpdateData,
          select: {
            textMessageCount: true,
            revealLevel: true,
            chapter1UnlockedAt: true,
            chapter2UnlockedAt: true,
            chapter3UnlockedAt: true,
            chapter4UnlockedAt: true,
            user1Id: true,
            user2Id: true,
          },
        });

        const unlockChapter = newlyUnlocked[newlyUnlocked.length - 1] ?? (chapterChanged ? nextRevealLevel : undefined);
        const systemMessage = unlockChapter
          ? await tx.message.create({
              data: {
                conversationId,
                senderId: conversation.user1Id,
                type: MessageType.SYSTEM,
                content: getChapterSystemLabel(unlockChapter),
                createdAt: new Date(message.createdAt.getTime() + 1),
              },
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            })
          : undefined;

        const finalRevealLevel = (updatedConversation.revealLevel ?? nextRevealLevel) as RevealLevel;

        const normalizedSystemMessage: SystemMessagePayload | undefined = systemMessage
          ? {
              id: systemMessage.id,
              conversationId,
              senderId: systemMessage.senderId,
              type: 'SYSTEM',
              content: systemMessage.content ?? getChapterSystemLabel(unlockChapter!),
              createdAt:
                systemMessage.createdAt instanceof Date
                  ? systemMessage.createdAt.toISOString()
                  : systemMessage.createdAt,
            }
          : undefined;

        return {
          message,
          revealLevel: finalRevealLevel,
          textMessageCount: updatedConversation.textMessageCount,
          chapter: nextRevealLevel,
          chapterChanged,
          systemMessage: normalizedSystemMessage,
        };
      });

      return result;
    });
  }

  static async sendVoiceMessage(
    conversationId: string,
    senderId: string,
    audioUrl: string,
    audioDuration: number
  ) {
    return this.withConversationLock(conversationId, async () => {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
        throw new Error('Unauthorized access to conversation');
      }

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          type: MessageType.VOICE,
          audioUrl,
          audioDuration,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
        },
      });

      return message;
    });
  }
}
