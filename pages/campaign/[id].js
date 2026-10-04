import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  return createClient(supabaseUrl, supabaseAnonKey);
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [campaign, setCampaign] = useState(null);
  const [user, setUser] = useState(null);
  const [participation, setParticipation] = useState(null);

  const [orderNumber, setOrderNumber] = useState('');
  const [reviewUrl, setReviewUrl] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const supabase = getSupabaseClient();
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!id) return;

    const supabase = getSupabaseClient();
    const fetchCampaignAndParticipation = async () => {
      setLoading(true);
      try {
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .single();

        if (campaignError) throw campaignError;
        setCampaign(campaignData);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: partData } = await supabase
            .from('participations')
            .select('*')
            .eq('campaign_id', id)
            .eq('reviewer_id', session.user.id)
            .maybeSingle();

          if (partData) {
            setParticipation(partData);
            if (partData.order_number) setOrderNumber(partData.order_number);
            if (partData.review_url) setReviewUrl(partData.review_url);
            if (partData.proof_image_url) setProofImageUrl(partData.proof_image_url);
          }
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err.message);
        setMessage({ type: 'error', text: '캠페인 정보를 불러오는 데 실패했습니다.' });
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignAndParticipation();
  }, [id]);

  const handleApplyMission = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('participations')
        .insert([
          {
            campaign_id: id,
            reviewer_id: user.id,
            status: 'applied',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setParticipation(data);
      setMessage({ type: 'success', text: '미션 참여가 신청되었습니다!' });
    } catch (err) {
      console.error('참여 신청 오류:', err.message);
      setMessage({ type: 'error', text: err.message || '참여 신청에 실패했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setMessage({ type: 'error', text: '주문번호(또는 결제 내역)를 입력해 주세요.' });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('participations')
        .update({
          order_number: orderNumber,
          review_url: reviewUrl,
          proof_image_url: proofImageUrl,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', participation.id)
        .select()
        .single();

      if (error) throw error;

      setParticipation(data);
      setMessage({ type: 'success', text: '인증 정보가 제출되었습니다!' });
    } catch (err) {
      console.error('제출 오류:', err.message);
      setMessage({ type: 'error', text: '인증 제출에 실패했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">캠페인 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">존재하지 않거나 마감된 캠페인입니다.</p>
      </div>
    );
  }

  const productPrice = campaign.product_price || 0;
  const rewardAmount = campaign.reward_amount || 0;
  const totalBenefit = productPrice + rewardAmount;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>{campaign.title} | 리얼뷰</title>
      </Head>

      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-block mb-6 text-sm text-gray-600 hover:text-gray-900 font-medium">
          ← 메인으로 돌아가기
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 sm:p-8">
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

          <div className="border-b pb-6 mb-6">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full mb-3">
              {campaign.platform || '네이버 스마트스토어'}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{campaign.title}</h1>
            
            {campaign.keyword && (
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-semibold text-gray-800">검색 키워드:</span> {campaign.keyword}
              </p>
            )}

            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex flex-wrap justify-between items-center gap-2 text-sm">
              <div>
                <span className="text-gray-500">제품 가격:</span>{' '}
                <span className="font-medium text-gray-800">{productPrice.toLocaleString()}원</span>
              </div>
              <div>
                <span className="text-gray-500">작성 리워드:</span>{' '}
                <span className="font-medium text-blue-600">+{rewardAmount.toLocaleString()}원</span>
              </div>
              <div className="text-base font-bold text-green-600">
                총 페이백 혜택: {totalBenefit.toLocaleString()} P
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">📋 상세 가이드라인 및 구매 미션</h2>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-950 whitespace-pre-line leading-relaxed">
              {campaign.guide_text || '제품 검색 후 구매를 진행하고 실구매 리뷰를 남겨주세요.'}
            </div>
          </div>

          <div className="border-t pt-6">
            {!participation ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-4">
                  가이드라인을 숙지하셨다면 아래 버튼을 눌러 미션 참여를 시작하세요.
                </p>
                <button
                  onClick={handleApplyMission}
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
                >
                  {submitting ? '신청 처리 중...' : '미션 참여 신청하기'}
                </button>
              </div>
            ) : participation.status === 'applied' ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">구매 및 리뷰 인증 제출</h3>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    리뷰 작성 중
                  </span>
                </div>

                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      1. 주문번호 / 결제 영수증 번호 *
                    </label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="예: 20261004-1234567"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      2. 작성한 리뷰 URL (선택)
                    </label>
                    <input
                      type="url"
                      value={reviewUrl}
                      onChange={(e) => setReviewUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      3. 리뷰 작성 캡처 이미지 URL (선택)
                    </label>
                    <input
                      type="url"
                      value={proofImageUrl}
                      onChange={(e) => setProofImageUrl(e.target.value)}
                      placeholder="캡처 이미지 링크"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 transition"
                  >
                    {submitting ? '제출 중...' : '인증 정보 제출하기'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-bold text-gray-800">제출된 구매 및 리뷰 인증</h3>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      participation.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : participation.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {participation.status === 'approved'
                      ? '검수 승인 (포인트 적립 완료)'
                      : participation.status === 'rejected'
                      ? '반려됨'
                      : '검수 대기 중'}
                  </span>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>주문번호:</strong> {participation.order_number}</p>
                  {participation.review_url && (
                    <p>
                      <strong>리뷰 URL:</strong>{' '}
                      <a href={participation.review_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                        {participation.review_url}
                      </a>
                    </p>
                  )}
                  <p className="text-xs text-gray-400 pt-2">
                    제출일: {new Date(participation.submitted_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
