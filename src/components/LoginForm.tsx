'use client';

import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username) {
      setStatus('error');
      setErrorMessage('ユーザー名を入力してください');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');

      // ユーザー情報を確認
      const userResponse = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!userResponse.ok) {
        const userData = await userResponse.json();
        throw new Error(userData.error || 'ユーザー情報の取得に失敗しました');
      }

      const userData = await userResponse.json();

      if (!userData.exists) {
        throw new Error('ユーザーが存在しません');
      }

      if (!userData.hasPasskey) {
        throw new Error('このユーザーにはパスキーが登録されていません');
      }

      // 認証オプションを取得
      const optionsResponse = await fetch('/api/login/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: userData.username }),
      });

      if (!optionsResponse.ok) {
        const optionsData = await optionsResponse.json();
        throw new Error(optionsData.error || '認証オプションの取得に失敗しました');
      }

      const optionsData = await optionsResponse.json();

      // ブラウザでパスキー認証を開始
      const authenticationResponse = await startAuthentication(optionsData.options);

      // 認証レスポンスを検証
      const verificationResponse = await fetch('/api/login/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: optionsData.username,
          authenticationResponse,
        }),
      });

      if (!verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        throw new Error(verificationData.error || '認証の検証に失敗しました');
      }

      const verificationData = await verificationResponse.json();
      if (!verificationData.verified) {
        throw new Error('認証の検証に失敗しました');
      }

      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || 'パスキーの認証中にエラーが発生しました');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">パスキーでログイン</h2>

      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            ユーザー名
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ユーザー名を入力"
            required
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? '処理中...' : 'パスキーでログイン'}
        </button>
      </form>

      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p>{errorMessage}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
          <p>ログインに成功しました！</p>
        </div>
      )}
    </div>
  );
}