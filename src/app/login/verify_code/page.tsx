"use client";
import React, { Suspense, useState } from "react";
import { Input } from "@/app/User/ui/input";
import { Button } from "@/app/User/ui/button";
import { Card, CardContent } from "@/app/User/ui/card";
import { Alert } from "@/app/User/ui/alert";
import axios from 'axios';
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const BackgroundImage = "/asset/bpsplg.png";
const Logo = "/asset/bpsplg.png";

const VerifyCode: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordSubmitLoading, setPasswordSubmitLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const email = searchParams ? searchParams.get("email") : "";
      const response = await axios.post("/api/verify-code", {
        code: verificationCode,
        email: email
      });
      if (response.status === 200) {
        setMessage("Verify success please reset password");
        setIsSuccess(true);
      } else {
        setMessage("Invalid verification code.");
        setIsSuccess(false);
      }
    } catch (error: any) {
      console.log(error);
      setMessage("Verification failed. Please try again.");
      setIsSuccess(false);
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordSubmitLoading(true);
    setPasswordError("");
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setPasswordSubmitLoading(false);
      return;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      setPasswordSubmitLoading(false);
      return;
    }
    try {
      const email = searchParams ? searchParams.get("email") : "";
      const response = await axios.post("/api/reset-password", {
        email: email,
        password: password,
        code: verificationCode
      });
      if (response.status === 200) {
        setMessage("Password reset successful!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setPasswordError("Failed to reset password. Please try again.");
      }
    } catch (error: any) {
      console.log(error);
      setPasswordError("Failed to reset password. Please try again.");
    }
    setPasswordSubmitLoading(false);
  };

  // RETURN FIXED JSX
  return (
    <div data-verify-page="true" style={{
      minHeight: '100vh',
      minWidth: '100vw',
      height: '100%',
      width: '100%',
      background: `url('${BackgroundImage}') center center / cover no-repeat fixed`,
      backgroundSize: 'cover',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: 0,
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
      fontFamily: 'Inter, Arial, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '40px',
        width: '100%',
        maxWidth: '420px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#fff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0', fontFamily: 'inherit' }}>
           SIMPEMGU
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, fontFamily: 'inherit' }}>
            {/* subtitle removed */}
          </p>
        </div>
        <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', fontFamily: 'inherit' }}>
          {isSuccess ? 'Set New Password' : 'Verify Code'}
        </h2>
        {/* Form Section */}
        {!isSuccess ? (
          <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', fontFamily: 'inherit' }}>
                Verification Code
              </label>
              <Input
                type="text"
                value={verificationCode}
                placeholder="Masukkan kode verifikasi"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Button
                type="submit"
                disabled={loading}
                style={{
                  backgroundImage: loading
                    ? 'linear-gradient(90deg, #9ca3af, #a5b4fc, #818cf8, #9ca3af)'
                    : 'linear-gradient(90deg, #4f46e5, #22d3ee, #1e3a8a, #4f46e5)',
                  backgroundSize: '200% 200%',
                  animation: loading ? 'none' : 'gradientMoveLogin 2.5s linear infinite',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(79,70,229,0.12)',
                  padding: '12px 32px',
                  margin: '0 auto',
                  minWidth: '180px',
                  display: 'block',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {loading ? 'Memproses...' : 'Verifikasi Kode'}
              </Button>
            </div>
            <style>{`
              @keyframes gradientMoveLogin {
                0% { background-position: 0% 50%; }
                100% { background-position: 100% 50%; }
              }
            `}</style>
            {message && !isSuccess && (
              <Alert variant="destructive" style={{ marginTop: '20px', width: '100%', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                {message}
              </Alert>
            )}
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} style={{ marginTop: '24px', width: '100%', whiteSpace: 'nowrap' }}>
            {message && (
              <Alert variant="default" style={{ marginTop: '20px', width: '100%', fontFamily: 'inherit' }}>
                {message}
              </Alert>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', fontFamily: 'inherit' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Masukkan password baru"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 40px 12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', fontFamily: 'inherit' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  placeholder="Konfirmasi password baru"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 40px 12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? (
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
            {passwordError && (
              <Alert variant="destructive" style={{ marginTop: '20px', width: '100%', fontFamily: 'inherit' }}>
                {passwordError}
              </Alert>
            )}
            <Button type="submit" style={{
              width: '100%',
              padding: '12px 16px',
              backgroundImage: passwordSubmitLoading
                ? 'linear-gradient(90deg, #9ca3af, #a5b4fc, #818cf8, #9ca3af)'
                : 'linear-gradient(90deg, #4f46e5, #22d3ee, #1e3a8a, #4f46e5)',
              backgroundSize: '200% 200%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              animation: passwordSubmitLoading ? 'none' : 'gradientMoveLogin 2.5s linear infinite',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: passwordSubmitLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(79,70,229,0.12)',
              position: 'relative',
              overflow: 'hidden'
            }} disabled={passwordSubmitLoading}>
              {passwordSubmitLoading ? 'Memproses...' : 'Setel Password Baru'}
              <style>{`
                @keyframes gradientMoveLogin {
                  0% { background-position: 0% 50%; }
                  100% { background-position: 100% 50%; }
                }
              `}</style>
            </Button>
          </form>
        )}
        <div style={{ textAlign: 'right', marginTop: '16px' }}>
          <Button style={{ fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', fontFamily: 'inherit' }} onClick={() => router.push('/login')}>Kembali ke Login</Button>
          <Button style={{ fontSize: '14px', color: '#4f46e5', background: 'none', border: 'none', fontFamily: 'inherit', marginLeft: '8px' }} onClick={() => router.push('/login/forget_psw')}>Lupa Password?</Button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#9ca3af', fontFamily: 'inherit' }}>
          
        </div>
      </div>
    </div>
  );
}

function VerifyCodePage() {
  return (
    <Suspense fallback={null}>
      <VerifyCode />
    </Suspense>
  );
}

export default VerifyCodePage;

