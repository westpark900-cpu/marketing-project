import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ReviewCheckPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('submitted'); // 'all', 'submitted', 'approved', 'rejected'

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      setLoading(true);
      try {
        // 1. 로그인 유저 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('광고주 로그인이 필요합니다.');
          router.push('/login');
          return;
        }
        setUser(session.user);

        // 2. 해당 광고주가 등록한 캠페인의 참여/제출 내역 조회
        // campaigns 테이블과 조인하여 현재 유저가 작성한 캠페인 항목만 필터링
        const { data, error } = await supabase
          .from('participations')
          .select(`
            *,
            campaigns!inner (
              id,
              title,
              advertiser_id,
              product_price,
              reward_amount,
              platform
            )
          `)
          .eq('campaigns.advertiser_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setParticipations(data || []);
      } catch (err) {
        console.error('검수 목록 불러오기 오류:', err.message);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndFetchData();
  }, [router]);

  // 승인 / 반려 처리 함수
  const handleUpdateStatus = async (participationId, nextStatus) => {
    const actionText = nextStatus === 'approved' ? '승인' : '반려';
    if (!confirm(`해당 제출 건을 [${actionText}] 처리하시겠습니까?`)) return;

    setProcessingId(participationId);
    try {
      // 1. 참여 상태 업데이트
      const { error: updateError } = await supabase
        .from('participations')
        .update({
          status: nextStatus,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', participationId);

      if (updateError) throw updateError;

      // 2. 상태 로컬 업데이트
      setParticipations((prev) =>
        prev.map((item) =>
          item.id === participationId ? { ...item, status: nextStatus } : item
        )
      );

      alert(`성공적으로 ${actionText} 처리되었습니다.`);
    } catch (err) {
      console.error('상태 변경 오류:', err.message);
      alert(`처리 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // 필터링된 제출 목록
  const filteredParticipations = participations.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">검수 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>리뷰 제출 검수 관리 | 리얼뷰 광고주 센터</title>
      </Head>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/advertiser" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            ← 광고주 홈으로 돌아가기
          </Link>
          <span className="text-sm text-gray-500">
            로그인 계정: <strong className="text-gray-800">{user?.email}</strong>
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="border-b pb-4 mb-6 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔍 구매평 및 리뷰 검수 센터</h1>
              <p className="text-sm text-gray-500 mt-1">
                리뷰어가 제출한 주문번호와 리뷰 URL을 검수하고 승인/반려를 진행합니다.
              </p>
            </div>

            {/* 상태 필터 탭 */}
            <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilter('submitted')}
                className={`px-3 py-1.5 rounded-md transition ${
                  filter === 'submitted' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                검수 대기중 ({participations.filter((p) => p.status === 'submitted').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-3 py-1.5 rounded-md transition ${
                  filter === 'approved' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                승인됨 ({participations.filter((p) => p.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-3 py-1.5 rounded-md transition ${
                  filter === 'rejected' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                반려됨 ({participations.filter((p) => p.status === 'rejected').length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-md transition ${
                  filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                전체보기 ({participations.length})
              </button>
            </div>
          </div>

          {/* 목록 테이블 */}
          {filteredParticipations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">해당하는 검수 건이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600 font-semibold">
                    <th className="py-3 px-4">캠페인명</th>
                    <th className="py-3 px-4">주문번호 (결제식별)</th>
                    <th className="py-3 px-4">리뷰 URL / 캡처</th>
                    <th className="py-3 px-4">제출일시</th>
                    <th className="py-3 px-4 text-center">상태 / 관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredParticipations.map((item) => {
                    const campaign = item.campaigns || {};
                    const totalPay = (campaign.product_price || 0) + (campaign.reward_amount || 0);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="py-4 px-4 font-medium text-gray-900 max-w-xs">
                          <p className="truncate">{campaign.title}</p>
                          <span className="text-xs text-blue-600 font-semibold">
                            지급 예정: {totalPay.toLocaleString()} P
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-gray-800 font-semibold">
                          {item.order_number || <span className="text-gray-400 font-normal">미입력</span>}
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          {item.review_url ? (
                            <a
                              href={item.review_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline block truncate"
                            >
                              {item.review_url}
                            </a>
                          ) : (
                            <span className="text-gray-400">리뷰 URL 없음</span>
                          )}
                          {item.proof_image_url && (
                            <a
                              href={item.proof_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-500 underline block mt-1"
                            >
                              📷 캡처 이미지 보기
                            </a>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs text-gray-500">
                          {item.submitted_at
                            ? new Date(item.submitted_at).toLocaleString()
                            : new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {item.status === 'submitted' ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'approved')}
                                disabled={processingId === item.id}
                                className="px-3 py-1.5 bg-green-600 text-white font-medium rounded hover:bg-green-700 text-xs transition disabled:bg-gray-300"
                              >
                                승인
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'rejected')}
                                disabled={processingId === item.id}
                                className="px-3 py-1.5 bg-red-600 text-white font-medium rounded hover:bg-red-700 text-xs transition disabled:bg-gray-300"
                              >
                                반려
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                item.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : item.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {item.status === 'approved'
                                ? '승인완료'
                                : item.status === 'rejected'
                                ? '반려됨'
                                : '신청 단계'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
