import { NextResponse } from 'next/server';
import { verifyRegResponse } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, registrationResponse } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    if (!registrationResponse) {
      return NextResponse.json(
        { error: '登録レスポンスが必要です' },
        { status: 400 }
      );
    }

    try {
      // 実際のアプリではセッションからチャレンジを取得する必要があります
      // ここではクライアントから送信されたデータを使用します
      const verification = await verifyRegResponse(username, registrationResponse);

      if (verification.verified) {
        return NextResponse.json({ verified: true, username });
      } else {
        return NextResponse.json(
          { error: '検証に失敗しました', verified: false },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('Registration verification error:', error);
      return NextResponse.json(
        { error: error.message || '登録の検証中にエラーが発生しました' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}