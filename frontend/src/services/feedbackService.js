import api from './api';

// Submit feedback
export const submitFeedback = async (feedbackData) => {
  const response = await api.post('/feedback', feedbackData);
  return response.data;
};

// Get user's own feedback
export const getUserFeedback = async () => {
  const response = await api.get('/feedback/my-feedback');
  return response.data;
};

// Get approved feedback (public)
export const getApprovedFeedback = async (limit = 6) => {
  const response = await api.get(`/feedback/approved?limit=${limit}`);
  return response.data;
};

// Admin: Get all feedback
export const getAllFeedback = async (page = 1, limit = 20) => {
  const response = await api.get(`/feedback/all?page=${page}&limit=${limit}`);
  return response.data;
};

// Admin: Toggle approve feedback
export const toggleApproveFeedback = async (id) => {
  const response = await api.put(`/feedback/${id}/toggle-approve`);
  return response.data;
};

// Admin: Delete feedback
export const deleteFeedback = async (id) => {
  const response = await api.delete(`/feedback/${id}`);
  return response.data;
};
