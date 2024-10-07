// utils/api.js

export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return { error: 'No token provided. Please log in again.' };
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            const error = await response.json();
            if (error.message.includes('expired')) {
                return { error: 'Token expired. Please log in again.' };
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            return { error: errorText };
        }

        return await response.json();
    } catch (error) {
        return { error: error.message };
    }
};
