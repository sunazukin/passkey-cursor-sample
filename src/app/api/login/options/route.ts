import { NextResponse } from 'next/server';
import { generateAuthOptions, getUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    // ユーザーが存在するか確認
    const user = getUser(username);
    if (!user) {
      console.error(`ログイン: ユーザー "${username}" が見つかりません`);
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // ユーザーにパスキーが登録されているか確認
    if (!user.devices || user.devices.length === 0) {
      console.error(`ログイン: ユーザー "${username}" にパスキーが登録されていません`);
      return NextResponse.json(
        { error: 'このユーザーにはパスキーが登録されていません' },
        { status: 400 }
      );
    }

    try {
      const options = await generateAuthOptions(username);

      // チャレンジをセッションに保存する必要があります（実際のアプリでは）
      // ここではシンプルにするためにクライアントに返します
      return NextResponse.json({ options, username });
    } catch (error: any) {
      console.error(`ログインオプション生成エラー:`, error);
      return NextResponse.json(
        { error: error.message || 'ログインオプションの生成に失敗しました' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('ログインオプションAPIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}