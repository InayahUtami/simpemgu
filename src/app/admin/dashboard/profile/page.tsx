"use client";
import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Lock, Camera, Trash2, LogOut, Save, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import ProfileMenu from '../../components/ProfileMenu';

interface ProfileData {
  id?: number;
  nama: string;
  email: string;
  foto_profil: string;
}

const ProfilePage: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({ nama: '', email: '', foto_profil: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [showSaved, setShowSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [logoutNotif, setLogoutNotif] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/user/profile', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setProfile({ id: json.data.id, nama: json.data.nama, email: json.data.email, foto_profil: json.data.foto_profil || '' });
        setAvatarPreview(json.data.foto_profil || '');
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showMsg('Ukuran foto maksimal 2MB', 'error'); return; }
    if (!file.type.startsWith('image/')) { showMsg('File harus berupa gambar', 'error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (base64.length > 1000000) { showMsg('Gambar terlalu besar. Gunakan gambar lebih kecil (max ~700KB).', 'error'); return; }
      setAvatarPreview(base64);
      setProfile(prev => ({ ...prev, foto_profil: base64 }));
      showMsg('Foto siap disimpan. Klik "Simpan Perubahan" untuk menyimpan.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async () => {
    const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: profile.nama, email: profile.email, foto_profil: null }) });
    const json = await res.json();
    if (json.success) {
      setAvatarPreview('');
      setProfile(prev => ({ ...prev, foto_profil: '' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { ...json.data, foto_profil: '' } }));
      showMsg('Foto profil berhasil dihapus.', 'success');
    } else { showMsg('Gagal menghapus foto', 'error'); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword.length < 6) { showMsg('Password minimal 6 karakter', 'error'); return; }
    if (newPassword && newPassword !== confirmPassword) { showMsg('Password baru dan konfirmasi tidak sama', 'error'); return; }
    const updateData: any = { nama: profile.nama, email: profile.email, foto_profil: profile.foto_profil || null };
    if (newPassword) updateData.password = newPassword;
    const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
    const json = await res.json();
    if (json.success) {
      showMsg('Profil berhasil diperbarui!', 'success');
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      setNewPassword(''); setConfirmPassword('');
      if (json.data) { setProfile({ id: json.data.id, nama: json.data.nama, email: json.data.email, foto_profil: json.data.foto_profil || '' }); setAvatarPreview(json.data.foto_profil || ''); }
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: json.data }));
    } else { showMsg(json.message || 'Gagal mengupdate profil', 'error'); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px',
    fontSize: '14px', color: '#1f2937', outline: 'none', background: 'white', boxSizing: 'border-box',
  };

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        .profile-input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      `}</style>

      <div className="admin-page-zoom" style={{ minHeight: '100vh', background: '#ffffff' }}>
        <main style={{
            flex: 1,
            padding: isMobile ? '24px 16px 32px 16px' : '32px 24px',
          }}>
            {!isMobile && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <a href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#1f2937', fontSize: '13px', fontWeight: '600', textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px', color: '#2563eb' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Kembali ke Dashboard
                </a>
                <ProfileMenu />
              </div>
            )}
            {isMobile && (
              <div style={{ marginBottom: '16px' }}>
                <a href="/admin/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#1f2937', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '15px', height: '15px', color: '#2563eb' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Kembali
                </a>
              </div>
            )}

            {/* Toast Notification */}
            {message && (
              <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '280px', maxWidth: '420px', background: 'white', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', border: `2px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`, animation: 'slideInRight 0.3s ease', overflow: 'hidden' }}>
                <div style={{ background: message.type === 'success' ? '#10b981' : '#ef4444', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>{message.type === 'success' ? '✓' : '✕'}</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{message.text}</span>
                </div>
              </div>
            )}

            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
              {/* Page Header */}
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', color: '#1e3a8a' }}>Profil Akun</h1>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '13px', fontWeight: '500' }}>Kelola informasi akun dan keamanan</p>
              </div>

              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #1e3a8a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#6b7280', fontWeight: 600 }}>Memuat profil...</p>
                  </div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : (
                <form onSubmit={handleUpdate}>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: isMobile ? 'wrap' : 'nowrap', alignItems: 'flex-start' }}>

                    {/* Left: Avatar Card */}
                    <div style={{ width: isMobile ? '100%' : '300px', flexShrink: 0 }}>
                      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.07)', padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative' }}>
                          {avatarPreview ? (
                            <img
                              src={avatarPreview.startsWith('/public/') ? avatarPreview.replace('/public', '') : avatarPreview}
                              alt="Foto Profil"
                              style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #dbeafe', boxShadow: '0 6px 20px rgba(0,0,0,0.14)' }}
                              onError={e => { (e.target as HTMLImageElement).src = '/asset/bpsplg.png'; }}
                            />
                          ) : (
                            <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)', border: '4px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}>
                              <User style={{ width: '64px', height: '64px', color: '#1e3a8a80' }} />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ position: 'absolute', bottom: '6px', right: '6px', width: '36px', height: '36px', background: '#1e3a8a', border: '3px solid white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
                          >
                            <Camera style={{ width: '16px', height: '16px', color: 'white' }} />
                          </button>
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoChange} />

                        {/* Name & email */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: '700', fontSize: '16px', color: '#1f2937', marginBottom: '4px' }}>{profile.nama || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{profile.email || '—'}</div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '100%', height: '1px', background: '#f3f4f6' }} />

                        {/* Action buttons */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 14px', background: '#f0f4ff', border: '1.5px solid #bfdbfe', borderRadius: '8px', color: '#1e3a8a', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            <Camera style={{ width: '14px', height: '14px' }} />
                            Ganti Foto
                          </button>
                          {avatarPreview && (
                            <button
                              type="button"
                              onClick={handleDeletePhoto}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 14px', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '8px', color: '#e11d48', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                            >
                              <Trash2 style={{ width: '14px', height: '14px' }} />
                              Hapus Foto
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => { setLogoutNotif(true); setTimeout(() => { setLogoutNotif(false); window.location.href = '/login'; }, 1200); }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 14px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '8px', color: '#c2410c', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            <LogOut style={{ width: '14px', height: '14px' }} />
                            Logout
                          </button>
                        </div>

                        {logoutNotif && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#b91c1c', fontWeight: 600, textAlign: 'center' }}>
                            Anda berhasil logout!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Form Cards */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

                      {/* Info Akun Card */}
                      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User style={{ width: '18px', height: '18px', color: '#1e3a8a' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1f2937' }}>Informasi Akun</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Perbarui nama dan email Anda</div>
                          </div>
                        </div>
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                              <User style={{ width: '13px', height: '13px', color: '#6b7280' }} />
                              Nama
                            </label>
                            <input
                              type="text"
                              name="nama"
                              value={profile.nama}
                              onChange={handleChange}
                              className="profile-input"
                              style={inputStyle}
                              required
                              placeholder="Masukkan nama lengkap"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                              <Mail style={{ width: '13px', height: '13px', color: '#6b7280' }} />
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={profile.email}
                              onChange={handleChange}
                              className="profile-input"
                              style={inputStyle}
                              required
                              placeholder="Masukkan email"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Keamanan Card */}
                      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck style={{ width: '18px', height: '18px', color: '#16a34a' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1f2937' }}>Keamanan</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Ubah password akun Anda</div>
                          </div>
                        </div>
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                              <Lock style={{ width: '13px', height: '13px', color: '#6b7280' }} />
                              Password Baru
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                                className="profile-input"
                                style={{ ...inputStyle, paddingRight: '44px' }}
                                placeholder="Kosongkan jika tidak ingin mengubah"
                              />
                              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
                                {showNewPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                              <Lock style={{ width: '13px', height: '13px', color: '#6b7280' }} />
                              Konfirmasi Password
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                className="profile-input"
                                style={{ ...inputStyle, paddingRight: '44px' }}
                                placeholder="Ulangi password baru"
                              />
                              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
                                {showConfirmPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                              </button>
                            </div>
                          </div>
                          {newPassword && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {[
                                { label: 'Min. 6 karakter', ok: newPassword.length >= 6 },
                                { label: 'Password cocok', ok: newPassword === confirmPassword && confirmPassword.length > 0 },
                              ].map(({ label, ok }) => (
                                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', background: ok ? '#f0fdf4' : '#fef2f2', color: ok ? '#16a34a' : '#dc2626', border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}` }}>
                                  {ok ? '✓' : '✕'} {label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 24px', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', width: '100%' }}
                      >
                        <Save style={{ width: '16px', height: '16px' }} />
                        Simpan Perubahan
                      </button>
                      {showSaved && (
                        <div style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600, fontSize: '13px', marginTop: '-8px' }}>
                          ✓ Profil berhasil diperbarui!
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>
          </main>
      </div>
    </>
  );
};

export default ProfilePage;
