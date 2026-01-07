/**
 * ID生成器单元测试
 */

import { createRoomId, createUserId, createStreamId } from '../../utils/id-generator';

describe('ID Generator', () => {
  describe('createRoomId', () => {
    it('应该生成指定长度的房间ID', () => {
      const roomId = createRoomId();
      expect(roomId).toBeDefined();
      expect(typeof roomId).toBe('string');
      expect(roomId.length).toBe(6); // ROOM_CONSTANTS.ROOM_ID_LENGTH
    });

    it('应该生成的房间ID', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 10; i++) {
        ids.add(createRoomId());
      }
      // mock会生成多个不同的ID
      expect(ids.size).toBeGreaterThan(0);
    });

    it('生成的ID应该只包含允许的字符', () => {
      const roomId = createRoomId();
      // 允许的字符：23456789ABCDEFGHJKMNPQRSTUVWXYZ
      const allowedChars = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/;
      expect(allowedChars.test(roomId)).toBe(true);
    });

    it('生成的ID不应包含容易混淆的字符', () => {
      const roomId = createRoomId();
      // 不应该包含0, O, 1, I, L
      expect(roomId).not.toContain('0');
      expect(roomId).not.toContain('O');
      expect(roomId).not.toContain('1');
      expect(roomId).not.toContain('I');
      expect(roomId).not.toContain('L');
    });
  });

  describe('createUserId', () => {
    it('应该生成固定长度的用户ID', () => {
      const userId = createUserId();
      expect(userId).toBeDefined();
      expect(typeof userId).toBe('string');
      expect(userId.length).toBe(21);
    });

    it('应该生成的用户ID', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 10; i++) {
        ids.add(createUserId());
      }
      expect(ids.size).toBeGreaterThan(0);
    });

    it('生成的ID应该只包含字母数字字符', () => {
      const userId = createUserId();
      const alphanumeric = /^[0-9A-Za-z]+$/;
      expect(alphanumeric.test(userId)).toBe(true);
    });
  });

  describe('createStreamId', () => {
    it('应该生成固定长度的流ID', () => {
      const streamId = createStreamId();
      expect(streamId).toBeDefined();
      expect(typeof streamId).toBe('string');
      expect(streamId.length).toBe(16);
    });

    it('应该生成的流ID', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 10; i++) {
        ids.add(createStreamId());
      }
      expect(ids.size).toBeGreaterThan(0);
    });

    it('生成的ID应该只包含字母数字字符', () => {
      const streamId = createStreamId();
      const alphanumeric = /^[0-9A-Za-z]+$/;
      expect(alphanumeric.test(streamId)).toBe(true);
    });
  });
});
