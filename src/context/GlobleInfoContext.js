import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { SERVER_API_URL } from '../server/server';
export const GlobleInfo = createContext();


export const GlobleInfoProvider = ({ children }) => {
  // Cart and wishlist numbers (shown in badges)
  const [productCount, setProductCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Cart products list
  const [cartlistItems, setCartlistItems] = useState([]);

  // Data that is sent to the checkout page
  const [checkoutData, setCheckoutData] = useState({});

  // Logged in user (null means not logged in)
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);



  // If server says 401, the token is expired.
  // So we delete the token and clear the user.
  const handle401 = async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('user_token');
      setUserData(null);
      setCartlistItems([]);
      setProductCount(0);
    }
  };

  // Get the logged in user from server
  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      console.log("getTken", token)
      // No token means user is not logged in
      if (!token) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const res = await axios.post(`${SERVER_API_URL}/api/logedin/user`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }
      );

      setUserData(res.data.user);
    } catch (error) {
      console.log('User fetch error', error.response?.data || error.message);
      setUserData(null);
      await handle401(error);
    } finally {
      setLoading(false);
    }
  };

  // Get cart products from server
  const getCart = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');

      // No token means cart is empty
      if (!token) {
        setCartlistItems([]);
        setProductCount(0);
        return [];
      }

      const response = await axios.get(`${SERVER_API_URL}/api/Cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('cart response:', response.data);
      const items = response.data.cartProducts || [];
      setCartlistItems(items);
      setProductCount(items.length);
      return items;

    } catch (error) {
      console.log('Get cart error:', error.response?.data || error.message);
      setCartlistItems([]);
      setProductCount(0);
      await handle401(error);
      return [];
    }
  };

  // Update the wishlist number from phone storage
  const updateCounts = async () => {
    try {
      const saved = await AsyncStorage.getItem('wishlist');
      const wishlistItems = saved ? JSON.parse(saved) : [];
      setWishlistCount(wishlistItems.length);
    } catch (error) {
      console.log('Error updating counts:', error);
    }
  };

  // Save checkout data
  const saveCheckoutData = (data) => {
    setCheckoutData(data);
  };

  // Call this after OTP is correct: it saves the token and loads user and cart
  const login = async (token) => {
    await AsyncStorage.setItem('user_token', token);
    await fetchUser();
    await getCart();
  };

  // Logout: delete the token and clear everything
  const logout = async () => {
    await AsyncStorage.removeItem('user_token');
    setUserData(null);
    setCartlistItems([]);
    setProductCount(0);
  };

  // Run only one time when the app opens
  useEffect(() => {
    fetchUser();
    getCart();
    updateCounts();
  }, []);

  return (
    <GlobleInfo.Provider
      value={{
        productCount,
        wishlistCount,
        cartlistItems,
        checkoutData,
        userData,
        isLoggedIn: !!userData,
        loading,
        updateCounts,
        getCart,
        fetchUser,
        login,
        logout,
        saveCheckoutData,
      }}
    >
      {children}
    </GlobleInfo.Provider>
  );
};