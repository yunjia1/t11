import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) return;
        
        const getUserProfile = async () => {
            try {
                const userResponse = await fetch(`${BACKEND_URL}/user/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${storedToken}`
                    }
                });
                if (userResponse.status === 200) {
                    const profileData = await userResponse.json();
                    setUser(profileData.user);
                } else {
                    console.warn('token invalid');
                    localStorage.clear();
                    setUser(null);
                }
            } catch (err) {
                localStorage.removeItem('token');
                setUser(null);
            }
        };
        
        // Execute the profile retrieval function
        getUserProfile();
    }, []);

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        navigate("/");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            if (!response.ok) return 'unsuccessful login';

            const data = await response.json();            
            localStorage.setItem('token', data.token);
            const res = await fetch(`${BACKEND_URL}/user/me`, {
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            });
            if (res.ok) {
                const userData = await res.json();
                setUser(userData.user);
                navigate('/profile');
                return null;
            } else {
                return 'user data not fetched';
            }
        } catch (error) {
            return 'error during login';
        }
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        try {
            const response = await fetch(`${BACKEND_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) return 'registration failed';
            navigate('/success');
            return null;
        } catch (error) {
            return 'error during registration';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};