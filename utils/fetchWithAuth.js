// fetchWithAuth.js
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  console.log('Sending request to:', url); // Log the URL
  console.log('Using token:', token); // Log the token used

  if (!token) {
      console.error('No token found, please log in.');
      throw new Error('No token found, please log in.');
  }

  const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from fetchWithAuth:', errorText); // Detailed error log
      throw new Error(errorText);
  }

  return response.json();
};

export default fetchWithAuth;
