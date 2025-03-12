import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';
import { loadServerData, saveServerData } from './server-storage';

// グローバル型の拡張
declare global {
  var users: User[];
}

// 認証情報を保存するためのインメモリストア（実際のアプリではデータベースを使用）
interface UserDevice {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
}

interface User {
  id: string;
  username: string;
  devices: UserDevice[];
  currentChallenge?: string;
}

// ユーザーデータの永続化
const USERS_STORAGE_KEY = 'passkey_demo_users';

// ユーザーデータをストレージから読み込む
const loadUsers = (): User[] => {
  if (typeof window === 'undefined') {
    // サーバーサイドの場合はファイルから読み込む
    return loadServerData<User[]>([]);
  }

  try {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    return storedUsers ? JSON.parse(storedUsers) : [];
  } catch (error) {
    console.error('ユーザーデータの読み込みに失敗しました:', error);
    return [];
  }
};

// ユーザーデータをストレージに保存
const saveUsers = (users: User[]) => {
  if (typeof window === 'undefined') {
    // サーバーサイドの場合はファイルに保存
    saveServerData<User[]>(users);
    return;
  }

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('ユーザーデータの保存に失敗しました:', error);
  }
};

// インメモリユーザーストア
let users: User[] = loadUsers();

// デバッグ用：ユーザーリストを表示
const logUsers = () => {
  console.log('現在のユーザーリスト:', users.map(u => ({
    username: u.username,
    id: u.id,
    devicesCount: u.devices.length,
    currentChallenge: u.currentChallenge ? '設定済み' : 'なし'
  })));
};

// RPの設定
const rpID = 'localhost';
const rpName = 'パスキーデモアプリ';
const origin = `http://${rpID}:3000`;

// ユーザーの存在確認
export const userExists = (username: string): boolean => {
  // 最新のユーザーデータを読み込む
  users = loadUsers();
  const exists = users.some(user => user.username === username);
  console.log(`ユーザー "${username}" の存在確認: ${exists}`);
  return exists;
};

// ユーザーの取得
export const getUser = (username: string): User | undefined => {
  // 最新のユーザーデータを読み込む
  users = loadUsers();
  const user = users.find(user => user.username === username);
  console.log(`ユーザー "${username}" の取得:`, user ? '成功' : '見つかりません');
  return user;
};

// ユーザーの作成
export const createUser = (username: string): User => {
  console.log(`新規ユーザー "${username}" を作成します`);
  const user: User = {
    id: crypto.randomUUID(),
    username,
    devices: [],
  };
  users.push(user);
  saveUsers(users); // ユーザーデータを保存
  console.log(`ユーザー "${username}" (ID: ${user.id}) を作成しました`);
  logUsers();
  return user;
};

// 登録オプションの生成
export const generateRegOptions = async (username: string) => {
  console.log(`"${username}" の登録オプションを生成します`);
  let user = getUser(username);

  if (!user) {
    console.log(`ユーザー "${username}" が見つからないため、新規作成します`);
    user = createUser(username);
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: username,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
    supportedAlgorithmIDs: [-7, -257], // Ed25519(-8)を除外
  });

  // チャレンジを保存
  user.currentChallenge = options.challenge;
  // ユーザーリストから該当ユーザーを更新
  const userIndex = users.findIndex(u => u.id === user.id);
  if (userIndex >= 0) {
    users[userIndex] = user;
  }
  saveUsers(users); // ユーザーデータを保存
  console.log(`ユーザー "${username}" のチャレンジを設定しました:`, options.challenge.slice(0, 10) + '...');
  logUsers();

  return options;
};

// 登録レスポンスの検証
export const verifyRegResponse = async (
  username: string,
  response: RegistrationResponseJSON
) => {
  console.log(`"${username}" の登録レスポンスを検証します`);
  const user = getUser(username);
  if (!user) {
    console.error(`ユーザー "${username}" が見つかりません`);
    logUsers();
    throw new Error('ユーザーが見つかりません');
  }

  if (!user.currentChallenge) {
    console.error(`ユーザー "${username}" のチャレンジが見つかりません`);
    throw new Error('チャレンジが見つかりません。再度登録を試みてください。');
  }

  try {
    console.log(`"${username}" の登録レスポンスを検証中...`);
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      // トランスポートがあれば保存
      const transports = response.response.transports as AuthenticatorTransportFuture[] || [];

      user.devices.push({
        credentialID: Buffer.from(credentialID).toString('base64url'),
        credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        transports,
      });
      console.log(`ユーザー "${username}" のデバイスを追加しました`);

      // ユーザーリストから該当ユーザーを更新
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex >= 0) {
        users[userIndex] = user;
      }
      saveUsers(users); // ユーザーデータを保存
    }

    // チャレンジをクリア
    user.currentChallenge = undefined;
    // ユーザーリストから該当ユーザーを更新
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex >= 0) {
      users[userIndex] = user;
    }
    saveUsers(users); // ユーザーデータを保存
    console.log(`ユーザー "${username}" のチャレンジをクリアしました`);
    logUsers();

    return verification;
  } catch (error) {
    console.error('Registration verification error:', error);
    throw error;
  }
};

// 認証オプションの生成
export const generateAuthOptions = async (username: string) => {
  console.log(`"${username}" の認証オプションを生成します`);
  const user = getUser(username);
  if (!user) {
    console.error(`ユーザー "${username}" が見つかりません`);
    throw new Error('ユーザーが見つかりません');
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: user.devices.map(device => ({
      id: Buffer.from(device.credentialID, 'base64url'),
      type: 'public-key',
      transports: device.transports,
    })),
  });

  // チャレンジを保存
  user.currentChallenge = options.challenge;
  // ユーザーリストから該当ユーザーを更新
  const userIndex = users.findIndex(u => u.id === user.id);
  if (userIndex >= 0) {
    users[userIndex] = user;
  }
  saveUsers(users); // ユーザーデータを保存
  console.log(`ユーザー "${username}" の認証チャレンジを設定しました:`, options.challenge.slice(0, 10) + '...');

  return options;
};

// 認証レスポンスの検証
export const verifyAuthResponse = async (
  username: string,
  response: AuthenticationResponseJSON
) => {
  console.log(`"${username}" の認証レスポンスを検証します`);
  const user = getUser(username);
  if (!user) {
    console.error(`ユーザー "${username}" が見つかりません`);
    throw new Error('ユーザーが見つかりません');
  }

  if (!user.currentChallenge) {
    console.error(`ユーザー "${username}" のチャレンジが見つかりません`);
    throw new Error('チャレンジが見つかりません。再度ログインを試みてください。');
  }

  const device = user.devices.find(
    device => device.credentialID === response.id
  );

  if (!device) {
    console.error(`ユーザー "${username}" の認証デバイスが見つかりません`);
    throw new Error('認証デバイスが見つかりません');
  }

  try {
    console.log(`"${username}" の認証レスポンスを検証中...`);
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(device.credentialID, 'base64url'),
        credentialPublicKey: Buffer.from(device.credentialPublicKey, 'base64url'),
        counter: device.counter,
      },
    });

    if (verification.verified) {
      device.counter = verification.authenticationInfo.newCounter;
      // ユーザーリストから該当ユーザーを更新
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex >= 0) {
        users[userIndex] = user;
      }
      saveUsers(users); // ユーザーデータを保存
      console.log(`ユーザー "${username}" のカウンターを更新しました:`, device.counter);
    }

    // チャレンジをクリア
    user.currentChallenge = undefined;
    // ユーザーリストから該当ユーザーを更新
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex >= 0) {
      users[userIndex] = user;
    }
    saveUsers(users); // ユーザーデータを保存
    console.log(`ユーザー "${username}" の認証チャレンジをクリアしました`);

    return verification;
  } catch (error) {
    console.error('Authentication verification error:', error);
    throw error;
  }
};