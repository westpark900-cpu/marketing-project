import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdvertiserPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  const [platform, setPlatform] = useState('네이버 스마트스토어');
  const [title, setTitle] = useState('');
  const [keyword, setKeyword] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [guideText, setGuideText] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('광고주 로그인이 필요합니다.');
        router.push('/');
        return;
      }
      setUser(session.user);
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !productPrice || !rewardAmount) {
      setMessage({ type: 'error', text: '필수 항목(제목, 제품 가격, 작성 리워드)을 입력해 주세요.' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .insert([
          {
            advertiser_id: user.id,
            platform,
            title,
            keyword,
            product_price: parseInt(productPrice, 10),
            reward_amount: parseInt(rewardAmount, 10),
            guide_text: guideText,
          },
        ]);

      if (error) throw error;

      setMessage({ type: 'success', text: '캠페인이 성공적으로 등록되었습니다!' });
      setTitle('');
      setKeyword('');
      setProductPrice('');
      setRewardAmount('');
      setGuideText('');

      setTimeout(() => {
        router.push('/advertiser/review-check');
      }, 1500);
    } catch (err) {
      console.error('캠페인 등록 오류:', err.message);
      setMessage({ type: 'error', text: '캠페인 등록에 실패했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>신규 캠페인 등록 | 리얼뷰 광고주 센터</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">
            ← 메인으로 돌아가기
          </Link>
          <Link href="/advertiser/review-check" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            🔍 제출된 리뷰 검수하기
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">📢 신규 리뷰 캠페인 등록</h1>
            <p className="text-sm text-gray-500 mt-1">
              오픈마켓 구매평 및 SNS 체험단 미션을 등록하고 실구매 리뷰어를 모집해 보세요.
            </p>
          </div>

          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">
                리뷰 플랫폼 / 쇼핑몰 *
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="네이버 스마트스토어">네이버 스마트스토어 (구매평 페이백)</option>
                <option value="쿠팡">쿠팡 (구매평 페이백)</option>
                <option value="자사몰/기타 오픈마켓">자사몰 / 기타 오픈마켓</option>
                <option value="네이버 블로그">네이버 블로그 (체험단)</option>
                <option value="인스타그램">인스타그램 (체험단/릴스)</option>
                <option value="유튜브 숏츠">유튜브 숏츠</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">
                캠페인 제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: [스마트스토어] 친환경 보틀 구매평 작성 이벤트"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">
                검색 키워드 (리뷰어가 검색할 상품 키워드)
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 친환경 보틀 추천, 가스통 커버"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  제품 가격 (원) - 페이백 금액 *
                </label>
                <input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="예: 25000"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  작성 리워드 (원) *
                </label>
                <input
                  type="number"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  placeholder="예: 5000"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">
                상세 가이드라인 / 미션 내용
              </label>
              <textarea
                rows={5}
                value={guideText}
                onChange={(e) => setGuideText(e.target.value)}
                placeholder="리뷰어가 구매 시 검색해야 하는 방식, 필수 포함 사진(2장 이상 등), 키워드 및 구매평 작성 가이드를 입력하세요."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition text-base"
            >
              {submitting ? '캠페인 등록 중...' : '캠페인 등록하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
