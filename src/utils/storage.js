import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the login token. Returns null if user is not logged in.
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('user_token');
  } catch (e) {
    return null;
  }
};

// Save the login token
export const setToken = (token) => AsyncStorage.setItem('user_token', token);

export const removeToken = () => AsyncStorage.removeItem('user_token');

// Read saved data (like wishlist). If nothing is saved, return the fallback.
export const getJSON = async (key, fallback) => {
  try {
    const saved = await AsyncStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

// Save data (like wishlist) in phone storage
export const setJSON = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value));