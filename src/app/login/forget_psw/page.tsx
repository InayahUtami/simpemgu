"use client";
import React, { useState } from "react";
import { Input } from "@/app/User/ui/input";
import { Button } from "@/app/User/ui/button";
import { Card, CardContent } from "@/app/User/ui/card";
import { Alert } from "@/app/User/ui/alert";
import axios from 'axios';
import { useRouter } from "next/navigation";

import Image from "next/image";
const BackgroundImage = "/asset/bpsplg.png";
const Logo = "/asset/bpsplg.png";

const ForgotPassword: React.FC = () => {
  const [inputEmail, setInputEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await axios.post("/api/send-verify-email", { email: inputEmail });
      const { message } = response.data;
      if (response.status === 200) {
        setMessage(message);
        router.push(`/login/verify_code?email=${inputEmail}`);
      } else {
        setError(true);
        setMessage("Failed to send reset link. Please try again.");
      }
    } catch (error: any) {
      setError(true);
      setMessage("Email not found. Please check your email.");
    }
    setLoading(false);
  };

  return (
    <div data-auth-page="true" style={{
      minHeight: '100vh',
      width: '100vw',
      background: `url('${BackgroundImage}') center center / cover no-repeat`,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflow: 'hidden',
      fontFamily: 'Inter, Arial, sans-serif'
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
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', fontFamily: 'inherit' }}>
              Email
            </label>
            <Input
              type="email"
              value={inputEmail}
              placeholder="Masukkan email Anda"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          <Button type="submit" style={{
            width: '100%',
            padding: '12px 16px',
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
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(79,70,229,0.12)',
            position: 'relative',
            overflow: 'hidden'
          }} disabled={loading}>
            {loading ? 'Memproses...' : 'Kirim Link Reset'}
            <style>{`
              @keyframes gradientMoveLogin {
                0% { background-position: 0% 50%; }
                100% { background-position: 100% 50%; }
              }
            `}</style>
          </Button>
          {message && (
            <Alert variant={error ? "destructive" : "default"} style={{ marginTop: '20px', width: '100%', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {message}
            </Alert>
          )}
        </form>
        <div style={{ textAlign: 'right', marginTop: '16px' }}>
          <Button style={{ fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', fontFamily: 'inherit' }} onClick={() => router.push("/login")}>Kembali ke Login</Button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#9ca3af', fontFamily: 'inherit' }}>
        
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

