// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLogin }) => {
  // 상태 관리
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 로그인 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // 백엔드 API에 로그인 요청
      const response = await axios.post('http://localhost:8000/token', 
        new URLSearchParams({
          'username': username,
          'password': password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      // 로그인 성공 시 부모 컴포넌트에 알림
      onLogin(response.data);
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        {/* 에러 메시지 표시 */}
        {error && <p className="error">{error}</p>}
        {/* 사용자명 입력 필드 */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        {/* 비밀번호 입력 필드 */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        {/* 로그인 버튼 */}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;