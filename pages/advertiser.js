import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from './index';

export default function Advertiser() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  // 폼 입력 상태
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('네이버 블로그');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [rewardPrice, setRewardPrice] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        alert('로그인이 필요한 페이지입니다.');
        router.push('/');
      } else {
        setSession(session);
      }
    });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !searchKeyword || !productPrice || !rewardPrice) {
      alert('모든 필수 항목을 입력해 주세요.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('campaigns').insert([
      {
        advertiser_id: session.user.id,
        title,
        platform,
        search_keyword: searchKeyword,
        product_price: parseInt(productPrice, 10),
        reward_price: parseInt(rewardPrice, 10),
        description,
      },
    ]);

    setLoading(false);

    if (error) {
      alert('캠페인 등록 실패: ' + error.message);
    } else {
      alert('🚀 새 리뷰 캠페인이 성공적으로 등록되었습니다!');
      router.push('/');
    }
  };

  if (!session) return <p style={{ padding: '20px' }}>확인 중...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <button 
        onClick={() => router.push('/')} 
        style={{ marginBottom: '20px', padding: '8px 14px', cursor: 'pointer', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px' }}
      >
        ← 메인으로 돌아가기
      </button>

      <h1>📢 신규 리뷰 캠페인 등록</h1>
      <p style={{ color: '#666' }}>광고주 전용 페이지입니다. 리뷰어들에게 맡길 제품 미션을 등록해 보세요.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>리뷰 플랫폼</label>
          <select 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="네이버 블로그">네이버 블로그</option>
            <option value="인스타그램">인스타그램</option>
            <option value="쿠팡">쿠팡</option>
            <option value="유튜브 숏츠">유튜브 숏츠</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>캠페인 제목 *</label>
          <input 
            type="text" 
            placeholder="예: [신제품] 친환경 가스통 커버 리뷰어 모집" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '95%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>검색 키워드 (리뷰어가 검색할 포털 키워드) *</label>
          <input 
            type="text" 
            placeholder="예: 캠핑 가스통 추천, 가스통 커버" 
            value={searchKeyword} 
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: '95%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>제품 가격 (원) *</label>
            <input 
              type="number" 
              placeholder="예: 25000" 
              value={productPrice} 
              onChange={(e) => setProductPrice(e.target.value)}
              style={{ width: '90%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>작성 리워드 (원) *</label>
            <input 
              type="number" 
              placeholder="예: 5000" 
              value={rewardPrice} 
              onChange={(e) => setRewardPrice(e.target.value)}
              style={{ width: '90%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>상세 가이드라인 / 미션 내용</label>
          <textarea 
            rows="5" 
            placeholder="리뷰어가 꼭 포함해야 하는 사진 키워드나 태그 등 상세 미션을 입력하세요." 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '95%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '12px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
        >
          {loading ? '등록 중...' : '캠페인 등록하기'}
        </button>
      </form>
    </div>
  );
}
