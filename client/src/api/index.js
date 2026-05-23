import api from './axios'

// Auth
export const authApi = {
    register: d => api.post('/auth/register', d),
    login: d => api.post('/auth/login', d),
    logout: () => api.post('/auth/logout'),
    refresh: () => api.post('/auth/refresh'),
    me: () => api.get('/auth/me'),
}

// Issues
export const issuesApi = {
    list: p => api.get('/issues', { params: p }),
    getById: id => api.get(`/issues/${id}`),
    create: d => api.post('/issues', d),
    update: (id, d) => api.patch(`/issues/${id}`, d),
    delete: id => api.delete(`/issues/${id}`),
    upvote: id => api.post(`/issues/${id}/upvote`),
    uploadImages: (id, fd) => api.post(`/issues/${id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteImage: (id, fileId) => api.delete(`/issues/${id}/images/${fileId}`),
    nearby: p => api.get('/issues/nearby/search', { params: p }),
}

// Comments
export const commentsApi = {
    list: issueId => api.get(`/comments/issue/${issueId}`),
    create: (issueId, d) => api.post(`/comments/issue/${issueId}`, d),
    update: (id, d) => api.patch(`/comments/${id}`, d),
    delete: id => api.delete(`/comments/${id}`),
}

// Users
export const usersApi = {
    me: () => api.get('/users/me'),
    updateMe: d => api.patch('/users/me', d),
    changePassword: d => api.patch('/users/me/password', d),
    uploadAvatar: fd => api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    dashboard: () => api.get('/users/me/dashboard'),
}

// Notifications
export const notifApi = {
    list: () => api.get('/notifications'),
    markRead: id => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.post('/notifications/read-all'),
}

// Analytics
export const analyticsApi = {
    summary: () => api.get('/analytics/summary'),
    trends: (days = 30) => api.get('/analytics/trends', { params: { days } }),
    categories: () => api.get('/analytics/categories'),
    statusDist: () => api.get('/analytics/status-distribution'),
    topIssues: (limit = 10) => api.get('/analytics/top-issues', { params: { limit } }),
    resolution: () => api.get('/analytics/resolution-metrics'),
}

// Admin
export const adminApi = {
    stats: () => api.get('/admin/stats'),
    issues: p => api.get('/admin/issues', { params: p }),
    moderate: (id, d) => api.patch(`/admin/issues/${id}`, d),
    bulkModerate: d => api.post('/admin/issues/bulk-moderate', d),
    users: () => api.get('/admin/users'),
    updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
    suspendUser: (id, suspended) => api.patch(`/admin/users/${id}/suspend`, { suspended }),
}

// Search
export const searchApi = {
    search: p => api.get('/search', { params: p }),
    suggestions: q => api.get('/search/suggestions', { params: { q } }),
}
