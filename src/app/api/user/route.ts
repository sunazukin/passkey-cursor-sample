import { NextResponse } from 'next/server';
import { getUser, userExists, createUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    console.log(`ユーザー情報API: "${username}" の情報を取得します`);
    const exists = userExists(username);
    let user = null;

    if (exists) {
      user = getUser(username);
      if (!user) {
        console.error(`ユーザー "${username}" は存在するはずですが、取得できませんでした`);
        return NextResponse.json(
          { error: 'ユーザー情報の取得に失敗しました' },
          { status: 500 }
        );
      }
    } else {
      // 新規ユーザーの場合は作成する（デモ用）
      console.log(`ユーザー "${username}" は存在しないため、新規作成します`);
      user = createUser(username);
    }

    const hasPasskey = user.devices && user.devices.length > 0;
    console.log(`ユーザー "${username}" のパスキー登録状況: ${hasPasskey ? 'あり' : 'なし'}`);

    return NextResponse.json({
      exists: exists,
      username: user.username,
      hasPasskey: hasPasskey,
    });
  } catch (error) {
    console.error('ユーザー情報APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}