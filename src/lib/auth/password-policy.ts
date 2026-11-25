// bcrypt silently ignores bytes after the 72nd, so longer passwords are refused
// everywhere (signup validation and hashing) using this one definition.
export const PASSWORD_MAX_BYTES = 72;

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function exceedsPasswordByteLimit(password: string): boolean {
  return utf8ByteLength(password) > PASSWORD_MAX_BYTES;
}
