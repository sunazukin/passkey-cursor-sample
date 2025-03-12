// サーバーサイドでのユーザーデータの永続化
// 実際のアプリではデータベースを使用するべきですが、
// このデモではNode.jsのプロセスメモリに保存します

import fs from 'fs';
import path from 'path';

// データファイルのパス
const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// データディレクトリの作成
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

// ユーザーデータの読み込み
export const loadServerData = <T>(defaultValue: T): T => {
  try {
    ensureDataDir();

    if (!fs.existsSync(USERS_FILE)) {
      return defaultValue;
    }

    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('サーバーデータの読み込みに失敗しました:', error);
    return defaultValue;
  }
};

// ユーザーデータの保存
export const saveServerData = <T>(data: T): void => {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('サーバーデータの保存に失敗しました:', error);
  }
};