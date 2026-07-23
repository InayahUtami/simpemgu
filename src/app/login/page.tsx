'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Styles as React CSS properties
const styles = {
  container: {
  minHeight: '100vh',
  width: '100%',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    padding: '60px 40px',
    width: '100%',
    maxWidth: '420px',
    minHeight: '620px'
  } as React.CSSProperties,
  headerContainer: {
    textAlign: 'center' as const, 
    marginBottom: '32px'
  } as React.CSSProperties,
  logoContainer: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto'
  } as React.CSSProperties,
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0'
  } as React.CSSProperties,
  subtitle: {
    color: '#6b7280',
    fontSize: '14px',
    margin: 0
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '20px'
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  } as React.CSSProperties,
  errorMessage: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#1e3a8a',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  } as React.CSSProperties,
  submitButton: (isLoading: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px 16px',
    backgroundColor: isLoading ? '#9ca3af' : '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease'
  }),
  forgotPassword: {
    textAlign: 'right' as const,
    marginBottom: '20px'
  } as React.CSSProperties,
  forgotPasswordLink: {
    color: '#4f46e5',
    fontSize: '14px',
    textDecoration: 'none'
  } as React.CSSProperties,
  demoBox: {
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    marginTop: '20px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#4b5563',
    border: '1px dashed #d1d5db'
  } as React.CSSProperties,
  footer: {
    textAlign: 'center' as const,
    marginTop: '24px',
    fontSize: '12px',
    color: '#9ca3af'
  } as React.CSSProperties
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Kirim request ke backend
    try {
      console.log('LOGIN: Mengirim request login...', { email: formData.email });
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        credentials: 'include' // Penting untuk ngrok agar cookie dikirim
      })
      console.log('LOGIN: Response status:', res.status);
      const data = await res.json()
      console.log('LOGIN: Response data:', data);
      
      if (res.ok && data.success) {
        console.log('LOGIN: Berhasil! Redirect ke dashboard...');
        
        // Simpan session ke localStorage juga untuk ngrok (backup)
        if (data.data && data.data.id) {
          localStorage.setItem('admin_user', JSON.stringify(data.data));
          localStorage.setItem('admin_logged_in', 'true');
        }
        
        // Force reload ke dashboard dengan beberapa metode
        console.log('Redirecting now...');
        router.replace('/admin/dashboard');
        router.push('/admin/dashboard');
        window.location.replace('/admin/dashboard');
      } else {
        console.error('LOGIN: Gagal -', data.message);
        setError(data.message || 'Email atau password salah')
      }
    } catch (err) {
      console.error('LOGIN: Error -', err);
      setError('Gagal terhubung ke server')
    }
    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }
  



  return (
    <>
      <style>{`
        body {
          background: url('/asset/bpsplg.png') center center / cover no-repeat fixed !important;
        }
      `}</style>
      <div data-login-page="true" style={styles.container}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.headerContainer}>
            <div style={{ ...styles.logoContainer, background: '#fff' }}>
              <img
                src="/asset/simpemgu.png"
                alt="SIMPEMGU Logo"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
            <h1 style={styles.title}>
            SIMPEMGU
            </h1>
            {/* subtitle removed */}
          </div>
        
          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Masukkan email Anda"
                autoComplete="email"
                required
                style={styles.input}
              />
            </div>
            {/* Password */}
            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Masukkan password Anda"
                  autoComplete="current-password"
                  required
                  style={{ ...styles.input, paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#6b7280'
                  }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Forgot Password */}
            <div style={styles.forgotPassword}>
              <Link href="/login/forget_psw" style={styles.forgotPasswordLink}>
                Lupa Password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div style={styles.errorMessage}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundImage: isLoading
                  ? 'linear-gradient(90deg, #9ca3af, #a5b4fc, #818cf8, #9ca3af)'
                  : 'linear-gradient(90deg, #4f46e5, #22d3ee, #1e3a8a, #4f46e5)',
                backgroundSize: '200% 200%',
                animation: isLoading ? 'none' : 'gradientMoveLogin 2.5s linear infinite',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(79,70,229,0.12)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isLoading ? 'Memproses...' : 'Login'}
            </button>
            <style>{`
              @keyframes gradientMoveLogin {
                0% { background-position: 0% 50%; }
                100% { background-position: 100% 50%; }
              }
            `}</style>
          </form>



          {/* Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
          
          </div>
        </div>
      </div>
    </>
  )
}

