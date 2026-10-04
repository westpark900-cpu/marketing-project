import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  // 환급 신청 폼 상태
  const [bankName, setBankName] = useState('KB국민은행');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('로그인이 필요합니다.');
          router.push('/login');
          return;
        }
        setUser(session.user);

        // 1. 내 리뷰 참여 및 페이백 적립 내역 조회
        const { data: partData, error: partError } = await supabase
          .from('participations')
          .select(`
            *,
            campaigns (
              title,
              product_price,
              reward_amount,
              platform
            )
          `)
          .eq('reviewer_id', session.user.id)
          .order('created_at', { ascending: false });

        if (partError) throw partError;
        setParticipations(partData || []);

        // 2. 출금/환급 신청 내역 조회 (withdrawals 테이블)
        const { data: withData } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        setWithdrawals(withData || []);
      } catch (err) {
        console.error('마이페이지 데이터 조회 오류:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // 총 적립된 포인트 (검수 승인 완료된 총 페이백 + 리워드 금액)
  const totalEarnedPoints = participations
    .filter((item) => item.status === 'approved')
    .reduce((sum, item) => {
      const price = item.campaigns?.product_price || 0;
      const reward = item.campaigns?.reward_amount || 0;
      return sum + price + reward;
    }, 0);

  // 출금 완료/신청 중인 포인트 합계
  const totalWithdrawnPoints = withdrawals
    .filter((w) => w.status !== 'rejected')
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  // 현재 출금 가능한 잔여 포인트
  const availablePoints = totalEarnedPoints - totalWithdrawnPoints;

  // 현금 환급 신청 처리
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);

    if (!amountNum || amountNum <= 0) {
      setMessage({ type: 'error', text: '올바른 환급 신청 금액을 입력해 주세요.' });
      return;
    }

    if (amountNum > availablePoints) {
      setMessage({ type: 'error', text: '출금 가능 포인트보다 큰 금액은 신청할 수 없습니다.' });
      return;
    }

    if (!accountNumber.trim() || !accountHolder.trim()) {
      setMessage({ type: 'error', text: '환급받으실 계좌 정보를 정확히 입력해 주세요.' });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .insert([
          {
            user_id: user.id,
            amount: amountNum,
            bank_name: bankName,
            account_number: accountNumber,
            account_holder: accountHolder,
            status: 'pending', // 'pending', 'completed', 'rejected'
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setWithdrawals([data, ...withdrawals]);
      setWithdrawAmount('');
      setMessage({ type: 'success', text: '현금 환급 신청이 접수되었습니다. (영업일 기준 1~2일 내 입금)' });
    } catch (err) {
      console.error('환급 신청 오류:', err.message);
      setMessage({ type: 'error', text: '환급 신청 처리 중 오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">마이페이지를 로딩 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>마이페이지 | 리얼뷰 (RealView)</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            ← 메인으로 돌아가기
          </Link>
          <span className="text-sm text-gray-500">
            계정: <strong className="text-gray-800">{user?.email}</strong>
          </span>
        </div>

        {/* 포인트 현황 요약 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">💰 나의 페이백 & 리워드 포인트</h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs text-blue-600 font-semibold mb-1">총 누적 적립 포인트</p>
              <p className="text-xl font-bold text-blue-950">{totalEarnedPoints.toLocaleString()} P</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 font-semibold mb-1">환급 완료 / 신청 중</p>
              <p className="text-xl font-bold text-gray-700">{totalWithdrawnPoints.toLocaleString()} P</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 font-semibold mb-1">현재 출금 가능 포인트</p>
              <p className="text-2xl font-extrabold text-green-600">{availablePoints.toLocaleString()} P</p>
            </div>
          </div>
        </div>

        {/* 현금 환급 신청 폼 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🏦 현금 환급 (출금) 신청</h2>

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

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">은행선택</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="KB국민은행">KB국민은행</option>
                  <option value="신한은행">신한은행</option>
                  <option value="우리은행">우리은행</option>
                  <option value="하나은행">하나은행</option>
                  <option value="카카오뱅크">카카오뱅크</option>
                  <option value="토스뱅크">토스뱅크</option>
                  <option value="NH농협">NH농협</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">계좌번호 (- 제외)</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1234567890"
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">예금주 성명</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="홍길동"
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">신청 금액 (원)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`최대 ${availablePoints.toLocaleString()}원 출금 가능`}
                max={availablePoints}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || availablePoints <= 0}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition"
            >
              {submitting ? '신청 처리 중...' : '현금 환급 신청하기'}
            </button>
          </form>
        </div>

        {/* 리뷰 참여 내역 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📦 나의 리뷰 미션 참여 내역</h2>

          {participations.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">참여한 캠페인이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {participations.map((item) => {
                const campaign = item.campaigns || {};
                const payAmount = (campaign.product_price || 0) + (campaign.reward_amount || 0);

                return (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg flex flex-wrap justify-between items-center gap-2 hover:bg-gray-50 transition"
                  >
                    <div>
                      <span className="text-xs text-blue-600 font-semibold">{campaign.platform}</span>
                      <h3 className="font-bold text-gray-900 text-sm">{campaign.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        주문번호: {item.order_number || '미제출'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">+{payAmount.toLocaleString()} P</p>
                      <span
                        className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          item.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : item.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status === 'approved'
                          ? '적립완료'
                          : item.status === 'rejected'
                          ? '반려됨'
                          : item.status === 'submitted'
                          ? '검수대기'
                          : '작성중'}
                      </span>
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
