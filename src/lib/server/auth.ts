import jwt from 'jsonwebtoken';
import { APP_SECRET } from '$env/static/private';

const EXPIRY = '7d';

export interface SessionData {
  i: string;
}

export function getSession(token?: string) {
  if (!token) return null;
  try {
    const data: SessionData = jwt.verify(token, APP_SECRET) as unknown as SessionData;
    if (!data.i || !/^[0-9]{10,20}$/.test(data.i)) return null;
    return data;
  } catch (e) {
    return null;
  }
}

export function createSession(data: SessionData) {
  const token = jwt.sign(data, APP_SECRET, { expiresIn: EXPIRY });
  return token;
}
