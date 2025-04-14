import { api } from './api';

export const getUserData = async () => {
    try {
        const response = await api.getUserProfile();
        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}; 