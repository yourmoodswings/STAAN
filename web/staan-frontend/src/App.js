import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

function App() {
    // States for authentication and profile
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [profileData, setProfileData] = useState(null); // For storing profile data

    // States for song search and review
    const [searchResults, setSearchResults] = useState([]); // Song search results
    const [selectedSong, setSelectedSong] = useState(null); // Selected song for review

    // Handles user registration
    const handleRegister = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessage(data.message);
            } else {
                const text = await response.text();
                setMessage(`Error: ${text}`);
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    // Handles user login
    const handleLogin = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessage(data.message);
                localStorage.setItem('token', data.token); // Store token
                setToken(data.token); // Update state
            } else {
                const text = await response.text();
                setMessage(`Error: ${text}`);
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    // Handles user logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setProfileData(null);
    };

    // Fetches user profile data
    const fetchProfile = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/users/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProfileData(data.user); // Store profile data
                setMessage('Profile data fetched successfully.');
            } else {
                const text = await response.text();
                setMessage(`Error: ${text}`);
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    // ** Song Search Logic **
    const handleSongSearch = async (query) => {
        // Mock API call to search for songs
        const mockResults = [
            { id: 1, name: 'Song A', artist: 'Artist X' },
            { id: 2, name: 'Song B', artist: 'Artist Y' },
            { id: 3, name: 'Song C', artist: 'Artist Z' },
        ];

        const filteredResults = mockResults.filter(
            (song) => song.name.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults(filteredResults); // Set search results
    };

    // Select a song to write a review for
    const handleSelectSong = (song) => {
        setSelectedSong(song); // Set the selected song for review
    };

    // Protected Route Logic for v6
    const ProtectedRoute = ({ children }) => {
        return token ? children : <Navigate to="/" />;
    };

    return (
        <Router>
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
                        <button onClick={handleLogin}>Login</button>
                    </div>
                ) : (
                    <div>
                        {/* User profile section */}
                        <h2>Profile</h2>
                        <button onClick={fetchProfile}>Fetch Profile</button>
                        <button onClick={handleLogout}>Logout</button>

                        {profileData ? (
                            <div>
                                <h3>Username: {profileData.username}</h3>
                                <h3>Email: {profileData.email}</h3>
                                <h4>Recent Reviews:</h4>
                                <ul>
                                    {profileData.recentReviews && profileData.recentReviews.length > 0 ? (
                                        profileData.recentReviews.map((review, index) => (
                                            <li key={index}>
                                                {review.song}: {review.review}
                                            </li>
                                        ))
                                    ) : (
                                        <li>No reviews found.</li>
                                    )}
                                </ul>
                                <h4>Favorite Artists:</h4>
                                <ul>
                                    {profileData.favoriteArtists && profileData.favoriteArtists.length > 0 ? (
                                        profileData.favoriteArtists.map((artist, index) => (
                                            <li key={index}>{artist}</li>
                                        ))
                                    ) : (
                                        <li>No favorite artists found.</li>
                                    )}
                                </ul>
                            </div>
                        ) : (
                            <p>No profile data loaded.</p>
                        )}

                        {/* Song Search Section */}
                        <div>
                            <h2>Search for a Song</h2>
                            <input
                                type="text"
                                placeholder="Search for songs..."
                                onChange={(e) => handleSongSearch(e.target.value)}
                            />
                            <ul>
                                {searchResults.map((song) => (
                                    <li key={song.id}>
                                        {song.name} by {song.artist}{' '}
                                        <button onClick={() => handleSelectSong(song)}>Review</button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Display the selected song for review */}
                        {selectedSong && (
                            <div>
                                <h3>Write a Review for {selectedSong.name} by {selectedSong.artist}</h3>
                                <textarea placeholder="Write your review here..." />
                                <button>Submit Review</button>
                            </div>
                        )}
                    </div>
                )}

                {message && <p>{message}</p>}

                <Routes>
                    <Route path="/" element={<div>Home</div>} />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <div>Profile Data</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
