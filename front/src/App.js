// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/me');
      setUser(response.data);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (userData) => {
    localStorage.setItem('token', userData.access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
    await fetchUserData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    setUser(null);
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      {isLoggedIn && user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;