import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Backend URL from environment variables
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

    // Check for token and fetch user data on component mount (handles hard reloads)
    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch(`${BACKEND_URL}/user/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUser(data.user);
                    } else {
                        // Token is invalid, clear it
                        localStorage.removeItem('token');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
        };

        fetchUserData();
    }, []);

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        // Remove the token from localStorage
        localStorage.removeItem('token');
        
        // Update the user state to null
        setUser(null);
        
        // Navigate to the home page
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

            const data = await response.json();

            if (!response.ok) {
                return data.message || 'Login failed';
            }

            // Store the token in localStorage
            localStorage.setItem('token', data.token);

            // Fetch user data to update context
            const userResponse = await fetch(`${BACKEND_URL}/user/me`, {
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData.user);
                
                // Navigate to profile page
                navigate('/profile');
                return null;
            } else {
                return 'Failed to fetch user data';
            }
        } catch (error) {
            console.error('Login error:', error);
            return 'An error occurred during login';
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

            const data = await response.json();

            if (!response.ok) {
                return data.message || 'Registration failed';
            }

            // Navigate to success page
            navigate('/success');
            return null;
        } catch (error) {
            console.error('Registration error:', error);
            return 'An error occurred during registration';
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