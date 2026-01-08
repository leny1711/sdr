import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'conversation_read_counts_v1';

export type ReadCounts = Record<string, number>;

let cachedReadCounts: ReadCounts | null = null;

const parseCounts = (value: string | null): ReadCounts => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const getConversationReadCounts = async (): Promise<ReadCounts> => {
  if (cachedReadCounts) {
    return cachedReadCounts;
  }
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    cachedReadCounts = parseCounts(stored);
    return cachedReadCounts;
  } catch (error) {
    console.error('Failed to read conversation counts', error);
    return cachedReadCounts ?? {};
  }
};

export const markConversationAsRead = async (
  conversationId: string,
  messageCount: number
): Promise<ReadCounts> => {
  try {
    const existing = cachedReadCounts ?? (await getConversationReadCounts());
    const updated = {
      ...existing,
      [conversationId]: messageCount,
    };
    cachedReadCounts = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to mark conversation as read', error);
    return cachedReadCounts ?? {};
  }
};
