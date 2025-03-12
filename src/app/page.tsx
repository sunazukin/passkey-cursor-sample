import RegisterForm from '@/components/RegisterForm';
import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">パスキー認証デモ</h1>

        <p className="text-center mb-8 text-gray-600">
          このデモアプリでは、パスキー（WebAuthn）を使用したユーザー認証を試すことができます。
          まずはユーザー名を入力してパスキーを登録し、その後同じユーザー名でログインしてみましょう。
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <RegisterForm />
          <LoginForm />
        </div>

        <div className="mt-12 p-6 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">パスキーについて</h2>
          <p className="mb-4">
            パスキー（Passkey）は、従来のパスワードに代わる新しい認証方法です。
            指紋認証やFace IDなどの生体認証や、デバイスのPINを使用して安全に認証を行います。
          </p>
          <p className="mb-4">
            パスキーのメリット:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>パスワードを覚える必要がない</li>
            <li>フィッシング攻撃に強い</li>
            <li>サイトごとに異なる認証情報が生成される</li>
            <li>生体認証によるセキュリティの向上</li>
          </ul>
          <p>
            このデモでは、WebAuthn APIを使用してブラウザとデバイスの機能を活用したパスキー認証を実装しています。
          </p>
        </div>
      </div>
    </div>
  );
}