import api from './api';

// ✅ WORKING LOGIN FUNCTION
export const loginUser = async () => {
  try {
    const response = await api.post('/auth/login', {
      username: "kminchelle",
      password: "0lelplR"
    });

    // Save token
    localStorage.setItem('ats_token', response.data.token);
    localStorage.setItem('ats_user', JSON.stringify(response.data));

    return response.data;

  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};