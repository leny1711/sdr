import prisma from '../config/database';
import { MessageType } from '@prisma/client';
import { ChapterNumber, MessageEnvelope, RevealLevel, SystemMessagePayload } from '../types';
import { CHAPTER_THRESHOLDS, getChapterSystemLabel } from '../utils/reveal.utils';

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
          throw new Error('Conversation introuvable');
        }

        if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
          throw new Error('Unauthorized access to conversation');
        }

        // Step 1: insert the new message
        const message = await tx.message.create({
          data: {
            conversationId,
            senderId,
            type: MessageType.TEXT,
            content,
          },
        });

        const unlockTime =
          message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt as unknown as string);

        // Step 2: increment message count
        const nextCount = (conversation.textMessageCount ?? 0) + 1;
        let revealLevel = (conversation.revealLevel ?? 0) as RevealLevel;
        let chapterChanged = false;
        let unlockedChapter: ChapterNumber | null = null;

        // Step 3: unlock the next chapter once when crossing the threshold; stop all logic after chapter 4
        if (revealLevel < 4) {
          const candidateChapter = (revealLevel + 1) as ChapterNumber;
          const threshold = CHAPTER_THRESHOLDS[candidateChapter] ?? Number.MAX_SAFE_INTEGER;
          if (nextCount >= threshold) {
            revealLevel = candidateChapter as RevealLevel;
            chapterChanged = true;
            unlockedChapter = candidateChapter;
          }
        }

        const updateData: Record<string, unknown> = {
          textMessageCount: nextCount,
        };

        if (chapterChanged && unlockedChapter !== null) {
          updateData.revealLevel = revealLevel;
          const chapterKey = `chapter${unlockedChapter}UnlockedAt` as const;
          const alreadyUnlocked = (conversation as Record<string, Date | null | unknown>)[chapterKey] as
            | Date
            | null
            | undefined;
          if (!alreadyUnlocked) {
            updateData[chapterKey] = unlockTime;
          }
        }

        await tx.conversation.update({
          where: { id: conversationId },
          data: updateData,
        });

        const systemMessage: SystemMessagePayload | undefined = chapterChanged && unlockedChapter !== null
          ? {
              id: `${message.id}-chapter-${unlockedChapter}`,
              conversationId,
              senderId: conversation.user1Id,
              type: 'SYSTEM',
              content: getChapterSystemLabel(unlockedChapter),
              createdAt: unlockTime.toISOString(),
            }
          : undefined;

        return {
          message,
          textMessageCount: nextCount,
          revealLevel,
          chapter: unlockedChapter,
          chapterChanged,
          systemMessage,
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
