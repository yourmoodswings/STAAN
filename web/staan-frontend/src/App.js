import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [profileData, setProfileData] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(localStorage.getItem('spotifyAccessToken') || null);
  const [spotifyData, setSpotifyData] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://staan-backend.onrender.com';

  const code = new URLSearchParams(window.location.search).get('code');

  // Function to fetch Spotify data
  const fetchSpotifyData = useCallback(async (accessToken) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        // Spotify token is expired, refresh it
        const refreshedTokenResponse = await fetch(`${API_BASE_URL}/api/users/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (refreshedTokenResponse.ok) {
          const refreshedData = await refreshedTokenResponse.json();
          const newAccessToken = refreshedData.access_token;
          localStorage.setItem('spotifyAccessToken', newAccessToken);
          return await fetchSpotifyData(newAccessToken); // Retry with new token
        } else {
          throw new Error('Failed to refresh Spotify token.');
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch Spotify data.');
      }

      const data = await response.json();
      setSpotifyData(data); // Store fetched Spotify data
    } catch (error) {
      console.error('Error fetching Spotify data:', error);
    }
  }, [API_BASE_URL]);

  // Function to fetch user profile
  const fetchProfile = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setMessage('No token found, please log in.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.user);

        if (data.user.isSpotifyConnected) {
          setSpotifyToken(localStorage.getItem('spotifyAccessToken'));
          fetchSpotifyData(localStorage.getItem('spotifyAccessToken'));
        } else {
          setMessage('Spotify not connected.');
        }
      } else {
        const text = await response.text();
        setMessage(`Error: ${text}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  }, [API_BASE_URL, fetchSpotifyData]);

  // Handle Spotify token exchange after Spotify login
  useEffect(() => {
    const fetchSpotifyToken = async () => {
      if (code && token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/users/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include', // Ensure credentials are included for session handling
            body: JSON.stringify({ code }),
          });

          if (!response.ok) {
            throw new Error('Failed to exchange Spotify token');
          }

          const data = await response.json();
          setSpotifyToken(data.access_token);
          localStorage.setItem('spotifyAccessToken', data.access_token);
          localStorage.setItem('spotifyRefreshToken', data.refresh_token);
          setMessage('Spotify connected successfully.');
          fetchProfile();  
          navigate(`/${profileData ? profileData.username : "profile"}`);
        } catch (err) {
          setMessage('Failed to connect with Spotify.');
        }
      }
    };

    fetchSpotifyToken();
  }, [code, token, profileData, fetchProfile, navigate, API_BASE_URL]);

  // Handle user registration
  const handleRegister = async () => {
    if (!username || !email || !password) {
      setMessage('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        setMessage('Registration successful. You can now log in.');
      } else {
        const text = await response.text();
        setMessage(`Error: ${text}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Handle user login
  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      setMessage('Please enter your email or username and password.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ emailOrUsername, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setMessage('Login successful.');
        setProfileData(data.user);
        navigate(`/${data.user.username}`);
      } else {
        const text = await response.text();
        setMessage(`Error: ${text}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('spotifyAccessToken');
    localStorage.removeItem('spotifyRefreshToken');
    setToken(null);
    setSpotifyToken(null);
    setProfileData(null);
    setSpotifyData(null);
    setMessage('Logged out.');
    navigate('/');
  };

  const handleSpotifyLogin = () => {
    const redirectUri = `${process.env.REACT_APP_SPOTIFY_REDIRECT_URI}`;
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const scopes = 'user-read-private user-read-email playlist-read-private';

    window.location.href = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/users/google-login`;
  };

  return (
    <div className="App">
      <h1>Music Review Platform</h1>
      {!token ? (
        <div>
          <h2>Register</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleRegister}>Register</button>

          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username or Email"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>

          <button onClick={handleGoogleLogin}>Login with Google</button>
        </div>
      ) : (
        <div>
          <h2>Profile</h2>
          <button onClick={fetchProfile}>Fetch Profile</button>
          <button onClick={handleLogout}>Logout</button>

          {profileData && (
            <div>
              <h3>Username: {profileData.username}</h3>
              <h3>Email: {profileData.email}</h3>
            </div>
          )}

          {!spotifyToken ? (
            <button onClick={handleSpotifyLogin}>Connect with Spotify</button>
          ) : (
            <div>
              <p>Spotify is connected.</p>
              {spotifyData && (
                <div>
              <h3>Spotify Data:</h3>
              <p>Display Name: {spotifyData.display_name}</p>
              <p>Email: {spotifyData.email}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )}

  {message && <p>{message}</p>}

  <Routes>
    <Route path="/" element={<div>Home</div>} />
    <Route path="/:username" element={<div>Profile Data</div>} />
  </Routes>
</div>
);
}

export default App;
