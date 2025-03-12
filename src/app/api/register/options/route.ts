import { NextResponse } from 'next/server';
import { generateRegOptions, getUser, createUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    // ユーザーが存在しない場合は作成する
    let user = getUser(username);
    if (!user) {
      user = createUser(username);
    }

    const options = await generateRegOptions(username);

    // チャレンジをセッションに保存する必要があります（実際のアプリでは）
    // ここではシンプルにするためにクライアントに返します
    return NextResponse.json({ options, username });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}