"use client";
import React, { useState, useRef, useEffect } from 'react';

interface ProfileData {
  nama: string;
  email: string;
  foto_profil: string;
}

const ProfileMenu: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile data dari database
  useEffect(() => {
    // Force clear any cached data
    setProfile(null);
    setIsLoading(true);
    fetchProfile();
    
    // Listen untuk profile update event
    const handleProfileUpdate = (event: any) => {
      if (event.detail) {
        // Validasi foto profil dari event
        let fotoUrl = '';
        if (event.detail.foto_profil) {
          const foto = event.detail.foto_profil;
          if (foto.startsWith('/') || (foto.startsWith('data:image/') && foto.length < 500000)) {
            fotoUrl = foto;
          }
        }
        
        setProfile({
          nama: event.detail.nama,
          email: event.detail.email,
          foto_profil: fotoUrl
        });
        setIsLoading(false);
      } else {
        // Jika tidak ada detail, fetch ulang
        fetchProfile();
      }
    };

    // Handle window focus - refresh data saat user kembali ke tab
    const handleFocus = () => {
      fetchProfile();
    };

    // Handle pageshow - refresh data saat back/forward dari browser (bfcache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Halaman di-restore dari bfcache
        setProfile(null);
        fetchProfile();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const getApiBaseUrl = () => {
    if (typeof window === 'undefined') return '';
    if (window.location.protocol === 'file:') {
      // Jika halaman dibuka lewat file://, gunakan local dev server sebagai fallback.
      return 'http://localhost:3000';
    }
    if (window.location.origin && window.location.origin !== 'null') {
      return window.location.origin;
    }
    return `${window.location.protocol}//${window.location.host}`;
  };

  const loadCachedProfile = () => {
    try {
      const cachedUser = window.localStorage.getItem('admin_user');
      if (!cachedUser) return false;

      const user = JSON.parse(cachedUser) as Partial<ProfileData>;
      if (!user.nama || !user.email) return false;

      setProfile({
        nama: user.nama,
        email: user.email,
        foto_profil: user.foto_profil || ''
      });
      return true;
    } catch {
      return false;
    }
  };

  const fetchProfile = async () => {
    try {
      // Tambahkan timestamp untuk cache busting
      const timestamp = new Date().getTime();
      const apiBase = getApiBaseUrl();
      const url = `${apiBase}/api/user/profile?t=${timestamp}`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) {
        loadCachedProfile();
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        // Validasi foto profil - jika base64 terlalu panjang atau invalid, gunakan kosong
        let fotoUrl = '';
        if (json.data.foto_profil) {
          const foto = json.data.foto_profil;
          // Cek apakah foto profil valid (path atau base64 yang tidak terlalu besar)
          if (foto.startsWith('/') || (foto.startsWith('data:image/') && foto.length < 500000)) {
            fotoUrl = foto;
          }
        }
        
        setProfile({
          nama: json.data.nama,
          email: json.data.email,
          foto_profil: fotoUrl
        });
      }
    } catch {
      loadCachedProfile();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 focus:outline-none"
        onClick={() => setShowDropdown((v) => !v)}
      >
        {isLoading ? (
          <>
            <span className="text-sm font-semibold text-blue-900">Loading...</span>
            <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          </>
        ) : profile ? (
          <>
            <span className="text-sm font-semibold text-blue-900">{profile.nama}</span>
            {profile.foto_profil ? (
              <img
                src={profile.foto_profil}
                alt="Avatar"
                className="w-10 h-10 rounded-full border-2 border-blue-300 shadow object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/asset/bpsplg.png';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
          </>
        ) : null}
      </button>
      {showDropdown && profile && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center gap-3 mb-4">
            {profile.foto_profil ? (
              <img 
                src={profile.foto_profil} 
                alt="Avatar" 
                className="w-14 h-14 rounded-full border object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/asset/bpsplg.png';
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
            <div>
              <div className="font-bold text-base">{profile.nama}</div>
              <div className="text-xs text-gray-500">{profile.email}</div>
            </div>
          </div>
          <a href="/admin/dashboard/profile" className="block w-full px-4 py-2 rounded hover:bg-blue-100 text-blue-600 font-semibold mb-2 text-center">Lihat Profil</a>
          <a
            href="#"
            className="block w-full px-4 py-2 rounded hover:bg-red-100 text-red-600 font-semibold text-center"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = 'http://localhost:3000/login';
            }}
          >
            Logout
          </a>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;

