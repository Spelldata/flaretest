"use strict";

/**
 * Generate random string.
 *
 * @param {number} length - Length of the string to generate.
 * @returns {string} - Random string.
 */
export function randomStr(length: number) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  if (length <= 0) {
    throw new Error("length has to be 1 or more.");
  }

  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}
