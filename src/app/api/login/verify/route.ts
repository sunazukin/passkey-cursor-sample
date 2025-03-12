import { NextResponse } from 'next/server';
import { verifyAuthResponse, getUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, authenticationResponse } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    if (!authenticationResponse) {
      return NextResponse.json(
        { error: '認証レスポンスが必要です' },
        { status: 400 }
      );
    }

    // ユーザーが存在するか確認
    const user = getUser(username);
    if (!user) {
      console.error(`認証検証: ユーザー "${username}" が見つかりません`);
      return NextResponse.json(
        { error: 'ユーザーが見つかりません', verified: false },
        { status: 404 }
      );
    }

    try {
      // 実際のアプリではセッションからチャレンジを取得する必要があります
      // ここではクライアントから送信されたデータを使用します
      console.log(`ユーザー "${username}" の認証レスポンスを検証します...`);
      const verification = await verifyAuthResponse(username, authenticationResponse);

      if (verification.verified) {
        console.log(`ユーザー "${username}" の認証に成功しました`);
        return NextResponse.json({ verified: true, username });
      } else {
        console.error(`ユーザー "${username}" の認証に失敗しました`);
        return NextResponse.json(
          { error: '検証に失敗しました', verified: false },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error(`認証検証エラー:`, error);
      return NextResponse.json(
        { error: error.message || '認証に失敗しました', verified: false },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('認証検証APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}