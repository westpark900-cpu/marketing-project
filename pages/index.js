import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Vercel 빌드 에러 방지를 위한 헬퍼 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('reviewer');
  const [campaigns, setCampaigns] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const initSessionAndData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          setUserRole(session.user.user_metadata?.role || 'reviewer');
        }

        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCampaigns(data || []);
      } catch (err) {
        console.error('데이터 로드 오류:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initSessionAndData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setUserRole(session.user.user_metadata?.role || 'reviewer');
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'error', text: '이메일과 비밀번호를 입력해 주세요.' });
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: userRole },
        },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: '회원가입 요청이 완료되었습니다! (이메일 인증 확인 후 로그인하세요)',
      });
    } catch (err) {
      console.error('회원가입 오류:', err.message);
      setMessage({ type: 'error', text: err.message || '회원가입 중 오류가 발생했습니다.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'error', text: '이메일과 비밀번호를 입력해 주세요.' });
      return;
    }

    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      setMessage({ type: 'success', text: '로그인되었습니다.' });
    } catch (err) {
      console.error('로그인 오류:', err.message);
      setMessage({ type: 'error', text: '로그인 정보가 올바르지 않습니다.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMessage({ type: 'success', text: '로그아웃 되었습니다.' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>리얼뷰 (RealView) - C2C 리뷰 리워드 플랫폼</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🚀 리얼뷰 - C2C 리뷰 리워드 플랫폼</h1>
            <p className="text-xs text-gray-500 mt-1">
              오픈마켓 구매평 페이백 &amp; SNS 리뷰 체험단
            </p>
          </div>

          {user && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">
                로그인 계정: <strong>{user.email}</strong> ({userRole === 'advertiser' ? '광고주' : '리뷰어'})
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition"
              >
                로그아웃
              </button>
              {userRole === 'advertiser' ? (
                <Link
                  href="/advertiser"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                >
                  + 새 캠페인 등록하기
                </Link>
              ) : (
                <Link
                  href="/mypage"
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition"
                >
                  💰 마이페이지
                </Link>
              )}
            </div>
          )}
        </div>

        {!user && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">로그인 / 회원가입</h2>

            {message.text && (
              <div
                className={`mb-4 p-4 rounded-lg text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="reviewer">일반 리뷰어 회원</option>
                  <option value="advertiser">광고주 회원</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm transition"
                >
                  {authLoading ? '처리 중...' : '로그인'}
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={authLoading}
                  className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 text-sm transition"
                >
                  회원가입
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🔥 진행 중인 리뷰 캠페인</h2>

          {loading ? (
            <p className="text-sm text-gray-500 text-center py-6">캠페인 목록을 로딩 중입니다...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">등록된 진행 중 캠페인이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((camp) => {
                const totalPay = (camp.product_price || 0) + (camp.reward_amount || 0);

                return (
                  <div
                    key={camp.id}
                    className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition bg-white flex flex-wrap justify-between items-center gap-4"
                  >
                    <div className="space-y-1">
                      <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full">
                        {camp.platform || '스마트스토어'}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{camp.title}</h3>
                      {camp.keyword && (
                        <p className="text-xs text-gray-500">
                          검색 키워드: <strong className="text-gray-700">{camp.keyword}</strong>
                        </p>
                      )}
                      <p className="text-xs text-gray-600 pt-1">
                        제품가: {camp.product_price?.toLocaleString()}원 | 리워드: +{camp.reward_amount?.toLocaleString()}원
                      </p>
                    </div>

                    <div className="text-right space-y-2">
                      <p className="text-base font-extrabold text-green-600">
                        총 페이백: {totalPay.toLocaleString()} P
                      </p>
                      <Link
                        href={`/campaign/${camp.id}`}
                        className="inline-block px-5 py-2 bg-gray-900 text-white font-semibold text-xs rounded-lg hover:bg-gray-800 transition"
                      >
                        미션 참여하기
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
