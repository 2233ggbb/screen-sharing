/**
 * 数据验证工具
 */

import {
  ROOM_CONSTANTS,
  USER_CONSTANTS,
  ERROR_MESSAGES,
} from '@screen-sharing/shared';

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 验证房间名称
 */
export function validateRoomName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: ERROR_MESSAGES.INVALID_ROOM_NAME };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_ROOM_NAME };
  }

  if (trimmedName.length > ROOM_CONSTANTS.MAX_ROOM_NAME_LENGTH) {
    return {
      valid: false,
      error: `房间名称不能超过${ROOM_CONSTANTS.MAX_ROOM_NAME_LENGTH}个字符`,
    };
  }

  return { valid: true };
}

/**
 * 验证房间密码
 */
export function validateRoomPassword(password?: string): ValidationResult {
  // 密码是可选的
  if (!password) {
    return { valid: true };
  }

  if (typeof password !== 'string') {
    return { valid: false, error: ERROR_MESSAGES.INVALID_PASSWORD };
  }

  if (password.length < ROOM_CONSTANTS.MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `密码长度不能少于${ROOM_CONSTANTS.MIN_PASSWORD_LENGTH}个字符`,
    };
  }

  if (password.length > ROOM_CONSTANTS.MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `密码长度不能超过${ROOM_CONSTANTS.MAX_PASSWORD_LENGTH}个字符`,
    };
  }

  // 只允许字母和数字
  if (!/^[a-zA-Z0-9]+$/.test(password)) {
    return {
      valid: false,
      error: '密码只能包含字母和数字',
    };
  }

  return { valid: true };
}

/**
 * 验证用户昵称
 */
export function validateNickname(nickname: string): ValidationResult {
  if (!nickname || typeof nickname !== 'string') {
    return { valid: false, error: ERROR_MESSAGES.INVALID_NICKNAME };
  }

  const trimmedNickname = nickname.trim();
  
  if (trimmedNickname.length < USER_CONSTANTS.MIN_NICKNAME_LENGTH) {
    return {
      valid: false,
      error: `昵称长度不能少于${USER_CONSTANTS.MIN_NICKNAME_LENGTH}个字符`,
    };
  }

  if (trimmedNickname.length > USER_CONSTANTS.MAX_NICKNAME_LENGTH) {
    return {
      valid: false,
      error: `昵称长度不能超过${USER_CONSTANTS.MAX_NICKNAME_LENGTH}个字符`,
    };
  }

  return { valid: true };
}

/**
 * 验证房间最大成员数
 */
export function validateMaxMembers(maxMembers?: number): ValidationResult {
  if (maxMembers === undefined) {
    return { valid: true };
  }

  if (typeof maxMembers !== 'number' || !Number.isInteger(maxMembers)) {
    return { valid: false, error: '最大成员数必须是整数' };
  }

  if (maxMembers < 2) {
    return { valid: false, error: '最大成员数不能少于2人' };
  }

  if (maxMembers > 50) {
    return { valid: false, error: '最大成员数不能超过50人' };
  }

  return { valid: true };
}

/**
 * 验证房间ID格式
 */
export function validateRoomId(roomId: string): ValidationResult {
  if (!roomId || typeof roomId !== 'string') {
    return { valid: false, error: '无效的房间ID' };
  }

  if (roomId.length !== ROOM_CONSTANTS.ROOM_ID_LENGTH) {
    return { valid: false, error: '无效的房间ID格式' };
  }

  return { valid: true };
}
