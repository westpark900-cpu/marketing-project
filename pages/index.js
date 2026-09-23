import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

export default function Home() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    fetchCampaigns();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  };

  const fetchCampaigns = async () => {
    const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    setCampaigns(data || []);
  };

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else {
      await supabase.from('profiles').insert([{ id: data.user.id, email, role }]);
      alert('회원가입이 완료되었습니다! 로그인 해주세요.');
    }
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      setSession(data.session);
      fetchProfile(data.user.id);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🚀 리얼뷰 - C2C 리뷰 리워드 플랫폼</h1>

      {!session ? (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h2>로그인 / 회원가입</h2>
          <input type="email" placeholder="이메일 주소" value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', marginBottom: '10px', width: '95%', padding: '10px' }} />
          <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', marginBottom: '10px', width: '95%', padding: '10px' }} />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ marginBottom: '15px', padding: '10px', width: '100%' }}>
            <option value="user">일반 리뷰어 회원</option>
            <option value="advertiser">광고주 회원</option>
          </select>
          <div>
            <button onClick={handleLogin} style={{ padding: '10px 20px', marginRight: '10px', cursor: 'pointer', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}>로그인</button>
            <button onClick={handleSignUp} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px' }}>회원가입</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '6px', marginBottom: '20px' }}>
            <p style={{ margin: 0 }}>로그인 계정: <b>{session.user.email}</b> ({profile?.role === 'advertiser' ? '광고주' : '리뷰어'})</p>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => setSession(null))} style={{ padding: '6px 12px', cursor: 'pointer' }}>로그아웃</button>

          <hr style={{ margin: '20px 0' }} />

          <h2>🔥 진행 중인 리뷰 캠페인</h2>
          {campaigns.length === 0 ? (
            <p>현재 등록된 캠페인이 없습니다. (광고주 페이지에서 등록 가능)</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {campaigns.map((c) => (
                <div key={c.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                  <h3>[{c.platform}] {c.title}</h3>
                  <p>검색 키워드: <b>{c.search_keyword}</b></p>
                  <p>제품가: {c.product_price.toLocaleString()}원 | 작성 리워드: <b>+{c.reward_price.toLocaleString()}원</b></p>
                  <button onClick={() => alert('미션 인증 제출 페이지로 연결됩니다.')} style={{ padding: '8px 16px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>미션 참여하기</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
