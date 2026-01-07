/**
 * 验证工具单元测试
 */

import {
  validateRoomName,
  validateRoomPassword,
  validateNickname,
  validateMaxMembers,
  validateRoomId,
} from '../../utils/validation';

describe('validation utils', () => {
  describe('validateRoomName', () => {
    it('应该验证通过有效的房间名称', () => {
      const result = validateRoomName('测试房间');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('应该拒绝空字符串', () => {
      const result = validateRoomName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝只有空格的字符串', () => {
      const result = validateRoomName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝null值', () => {
      const result = validateRoomName(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝非字符串类型', () => {
      const result = validateRoomName(123 as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝超过最大长度的房间名称', () => {
      const longName = 'a'.repeat(51); // 超过50字符
      const result = validateRoomName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不能超过');
    });

    it('应该接受最大长度的房间名称', () => {
      const maxName = 'a'.repeat(50);
      const result = validateRoomName(maxName);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateRoomPassword', () => {
    it('应该允许没有密码', () => {
      const result = validateRoomPassword();
      expect(result.valid).toBe(true);
    });

    it('应该允许undefined密码', () => {
      const result = validateRoomPassword(undefined);
      expect(result.valid).toBe(true);
    });

    it('应该验证通过有效的密码', () => {
      const result = validateRoomPassword('abc123');
      expect(result.valid).toBe(true);
    });

    it('应该拒绝非字符串类型', () => {
      const result = validateRoomPassword(123 as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝过短的密码', () => {
      const result = validateRoomPassword('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不能少于');
    });

    it('应该拒绝过长的密码', () => {
      const longPassword = 'a'.repeat(21);
      const result = validateRoomPassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不能超过');
    });

    it('应该拒绝包含特殊字符的密码', () => {
      const result = validateRoomPassword('abc@123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('只能包含字母和数字');
    });

    it('应该拒绝包含空格的密码', () => {
      const result = validateRoomPassword('abc 123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('只能包含字母和数字');
    });

    it('应该接受最小长度的密码', () => {
      const result = validateRoomPassword('abcd');
      expect(result.valid).toBe(true);
    });

    it('应该接受最大长度的密码', () => {
      const maxPassword = 'a'.repeat(20);
      const result = validateRoomPassword(maxPassword);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateNickname', () => {
    it('应该验证通过有效的昵称', () => {
      const result = validateNickname('用户123');
      expect(result.valid).toBe(true);
    });

    it('应该拒绝空字符串', () => {
      const result = validateNickname('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝null值', () => {
      const result = validateNickname(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝非字符串类型', () => {
      const result = validateNickname(123 as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝过短的昵称', () => {
      const result = validateNickname('a');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不能少于');
    });

    it('应该拒绝过长的昵称', () => {
      const longNickname = 'a'.repeat(21);
      const result = validateNickname(longNickname);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不能超过');
    });

    it('应该接受最小长度的昵称', () => {
      const result = validateNickname('ab');
      expect(result.valid).toBe(true);
    });

    it('应该接受最大长度的昵称', () => {
      const maxNickname = 'a'.repeat(20);
      const result = validateNickname(maxNickname);
      expect(result.valid).toBe(true);
    });

    it('应该自动trim空格', () => {
      const result = validateNickname('  abc  ');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateMaxMembers', () => {
    it('应该允许undefined', () => {
      const result = validateMaxMembers();
      expect(result.valid).toBe(true);
    });

    it('应该允许undefined值', () => {
      const result = validateMaxMembers(undefined);
      expect(result.valid).toBe(true);
    });

    it('应该验证通过有效的数字', () => {
      const result = validateMaxMembers(10);
      expect(result.valid).toBe(true);
    });

    it('应该拒绝非数字类型', () => {
      const result = validateMaxMembers('10' as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('必须是整数');
    });

    it('应该拒绝小数', () => {
      const result = validateMaxMembers(10.5);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('必须是整数');
    });

    it('应该拒绝小于2的数字', () => {
      const result = validateMaxMembers(1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不能少于2人');
    });

    it('应该拒绝大于50的数字', () => {
      const result = validateMaxMembers(51);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不能超过50人');
    });

    it('应该接受边界值2', () => {
      const result = validateMaxMembers(2);
      expect(result.valid).toBe(true);
    });

    it('应该接受边界值50', () => {
      const result = validateMaxMembers(50);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateRoomId', () => {
    it('应该验证通过正确长度的房间ID', () => {
      const roomId = 'A'.repeat(6); // 默认长度为6
      const result = validateRoomId(roomId);
      expect(result.valid).toBe(true);
    });

    it('应该拒绝null值', () => {
      const result = validateRoomId(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('无效的房间ID');
    });

    it('应该拒绝非字符串类型', () => {
      const result = validateRoomId(123 as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('无效的房间ID');
    });

    it('应该拒绝错误长度的房间ID', () => {
      const result = validateRoomId('ABC12345');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('无效的房间ID格式');
    });

    it('应该拒绝空字符串', () => {
      const result = validateRoomId('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('无效的房间ID');
    });
  });
});
