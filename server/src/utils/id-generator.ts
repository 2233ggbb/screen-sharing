/**
 * ID生成工具
 */

import { customAlphabet } from 'nanoid';
import { config } from '../config';

/**
 * 房间ID生成器
 * 使用数字和大写字母，避免混淆字符(0,O,1,I,L)
 */
const roomIdAlphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const generateRoomId = customAlphabet(roomIdAlphabet, config.room.idLength);

/**
 * 生成房间ID
 */
export function createRoomId(): string {
  return generateRoomId();
}

/**
 * 用户ID生成器
 * 使用nanoid的默认字母表
 */
const userIdAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateUserId = customAlphabet(userIdAlphabet, 21);

/**
 * 生成用户ID
 */
export function createUserId(): string {
  return generateUserId();
}

/**
 * 流ID生成器
 */
const streamIdAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateStreamId = customAlphabet(streamIdAlphabet, 16);

/**
 * 生成流ID
 */
export function createStreamId(): string {
  return generateStreamId();
}
