'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username) {
      setStatus('error');
      setErrorMessage('ユーザー名を入力してください');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');

      // ユーザー情報を確認または作成
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

      // 登録オプションを取得
      const optionsResponse = await fetch('/api/register/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!optionsResponse.ok) {
        const optionsData = await optionsResponse.json();
        throw new Error(optionsData.error || '登録オプションの取得に失敗しました');
      }

      const optionsData = await optionsResponse.json();

      // ブラウザでパスキー登録を開始
      const registrationResponse = await startRegistration(optionsData.options);

      // 登録レスポンスを検証
      const verificationResponse = await fetch('/api/register/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: optionsData.username, // サーバーから返されたユーザー名を使用
          registrationResponse,
        }),
      });

      if (!verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        throw new Error(verificationData.error || '登録の検証に失敗しました');
      }

      const verificationData = await verificationResponse.json();
      if (!verificationData.verified) {
        throw new Error('登録の検証に失敗しました');
      }

      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || 'パスキーの登録中にエラーが発生しました');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">パスキーを登録</h2>

      <form onSubmit={handleRegister}>
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
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? '処理中...' : 'パスキーを登録'}
        </button>
      </form>

      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p>{errorMessage}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
          <p>パスキーの登録が完了しました！</p>
        </div>
      )}
    </div>
  );
}