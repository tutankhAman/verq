import { api } from '../api';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: { message: 'Success' } }),
  })
);

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should handle login successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await api.login(credentials);

      expect(fetch).toHaveBeenCalledWith(
        'https://verq.onrender.com/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        })
      );
      expect(response).toEqual({ data: { message: 'Success' } });
    });

    it('should handle registration successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await api.register(userData);

      expect(fetch).toHaveBeenCalledWith(
        'https://verq.onrender.com/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );
      expect(response).toEqual({ data: { message: 'Success' } });
    });
  });

  describe('User Profile', () => {
    it('should fetch user profile with token', async () => {
      localStorage.setItem('token', 'test-token');

      const response = await api.getUserProfile();

      expect(fetch).toHaveBeenCalledWith(
        'https://verq.onrender.com/api/users/profile',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(response).toEqual({ data: { message: 'Success' } });
    });
  });

  describe('Interviews', () => {
    it('should fetch interviews', async () => {
      const response = await api.getInterviews();

      expect(fetch).toHaveBeenCalledWith(
        'https://verq.onrender.com/api/interviews',
        expect.any(Object)
      );
      expect(response).toEqual({ data: { message: 'Success' } });
    });

    it('should create a new interview', async () => {
      const interviewData = {
        position: 'Software Engineer',
        company: 'Tech Corp',
        date: new Date().toISOString(),
        status: 'Scheduled',
      };

      const response = await api.createInterview(interviewData);

      expect(fetch).toHaveBeenCalledWith(
        'https://verq.onrender.com/api/interviews',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(interviewData),
        })
      );
      expect(response).toEqual({ data: { message: 'Success' } });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Error occurred' }),
        })
      );

      await expect(api.getUserProfile()).rejects.toThrow('Error occurred');
    });
  });
}); 