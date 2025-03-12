# パスキーデモアプリ

このプロジェクトは、WebAuthnを使用したパスキー認証のデモアプリケーションです。ユーザーはパスキーを使用して登録・ログインすることができます。

## 機能

- パスキーを使用したユーザー登録
- パスキーを使用したログイン認証
- サーバーサイドでのユーザーデータの永続化

## 技術スタック

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [TypeScript](https://www.typescriptlang.org/) - 型付きJavaScript
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク
- [SimpleWebAuthn](https://simplewebauthn.dev/) - WebAuthn実装ライブラリ

## セットアップ

### 前提条件

- Node.js 18.x以上
- npm 9.x以上

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/passkey-demo.git
cd passkey-demo

# 依存関係のインストール
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 使用方法

1. ホームページから「登録」ボタンをクリックします
2. ユーザー名を入力し、「パスキーを登録」ボタンをクリックします
3. ブラウザのパスキー登録プロンプトに従って、パスキーを作成します
4. 登録が完了したら、「ログイン」ページに移動します
5. 登録したユーザー名を入力し、「パスキーでログイン」ボタンをクリックします
6. ブラウザのパスキー認証プロンプトに従って、認証を完了します

## 注意事項

- このアプリケーションはデモ用であり、本番環境での使用は推奨されません
- ユーザーデータはサーバーのファイルシステム（`.data/users.json`）に保存されます
- パスキーの使用には、WebAuthnをサポートするモダンブラウザが必要です

## ライセンス

MIT

## 参考資料

- [WebAuthn ガイド](https://webauthn.guide/)
- [SimpleWebAuthn ドキュメント](https://simplewebauthn.dev/docs/) 