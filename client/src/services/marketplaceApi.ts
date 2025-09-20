/**
 * Marketplace API Service
 * Handles all marketplace-related API calls
 */

import axios from 'axios';

const API_BASE_URL = '/api/marketplace';

interface SearchFilters {
  search?: string;
  category?: string;
  genre?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  licenseType?: 'free' | 'premium' | 'exclusive';
  priceMin?: number;
  priceMax?: number;
  featured?: boolean;
  verified?: boolean;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
}

interface TemplateSubmissionData {
  title: string;
  description: string;
  templateData: string;
  category: string;
  genre?: string[];
  subgenre?: string[];
  structure?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  targetWordCount?: number;
  estimatedDuration?: string;
  targetAudience?: string;
  writingLevel?: string;
  licenseType?: 'free' | 'premium' | 'exclusive';
  price?: number;
  previewContent?: string;
  coverImage?: string;
  screenshots?: string[];
}

interface ReviewData {
  rating: number;
  title?: string;
  content: string;
  isRecommended?: boolean;
  usageRating?: number;
  difficultyRating?: number;
  valueRating?: number;
}

interface CollectionData {
  title: string;
  description?: string;
  type?: 'user' | 'editorial' | 'featured' | 'genre';
  isPublic?: boolean;
  coverImage?: string;
  tags?: string[];
  category?: string;
}

class MarketplaceApiService {
  
  // TEMPLATE DISCOVERY AND BROWSING
  
  async searchTemplates(filters: SearchFilters, options: PaginationOptions) {
    const params = new URLSearchParams();
    
    // Add filters
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.licenseType) params.append('licenseType', filters.licenseType);
    if (filters.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
    if (filters.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());
    if (filters.featured) params.append('featured', 'true');
    if (filters.verified) params.append('verified', 'true');
    
    // Add pagination
    params.append('page', options.page.toString());
    params.append('limit', options.limit.toString());
    params.append('sortBy', options.sortBy);

    const response = await axios.get(`${API_BASE_URL}/templates?${params}`);
    return response.data;
  }

  async getTemplateById(templateId: string) {
    const response = await axios.get(`${API_BASE_URL}/templates/${templateId}`);
    return response.data;
  }

  async getTemplatePreview(templateId: string) {
    const response = await axios.get(`${API_BASE_URL}/templates/${templateId}/preview`);
    return response.data;
  }

  // TEMPLATE SUBMISSION AND MANAGEMENT
  
  async submitTemplate(templateData: TemplateSubmissionData) {
    const response = await axios.post(`${API_BASE_URL}/templates`, templateData);
    return response.data;
  }

  async updateTemplate(templateId: string, updateData: TemplateSubmissionData) {
    const response = await axios.put(`${API_BASE_URL}/templates/${templateId}`, updateData);
    return response.data;
  }

  async deleteTemplate(templateId: string) {
    const response = await axios.delete(`${API_BASE_URL}/templates/${templateId}`);
    return response.data;
  }

  // TEMPLATE PURCHASES AND DOWNLOADS
  
  async purchaseTemplate(templateId: string, paymentMethod: string) {
    const response = await axios.post(`${API_BASE_URL}/templates/${templateId}/purchase`, {
      paymentMethod,
    });
    return response.data;
  }

  async downloadTemplate(templateId: string) {
    const response = await axios.post(`${API_BASE_URL}/templates/${templateId}/download`);
    return response.data;
  }

  // REVIEWS AND RATINGS
  
  async getTemplateReviews(templateId: string, options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);

    const response = await axios.get(`${API_BASE_URL}/templates/${templateId}/reviews?${params}`);
    return response.data;
  }

  async submitReview(templateId: string, reviewData: ReviewData) {
    const response = await axios.post(`${API_BASE_URL}/templates/${templateId}/reviews`, reviewData);
    return response.data;
  }

  async updateReview(reviewId: string, updateData: ReviewData) {
    const response = await axios.put(`${API_BASE_URL}/reviews/${reviewId}`, updateData);
    return response.data;
  }

  // TEMPLATE LIKES AND FAVORITES
  
  async toggleTemplateLike(templateId: string) {
    const response = await axios.post(`${API_BASE_URL}/templates/${templateId}/like`);
    return response.data;
  }

  // CREATOR PROFILES
  
  async getCreatorProfile(creatorId: string) {
    const response = await axios.get(`${API_BASE_URL}/creators/${creatorId}`);
    return response.data;
  }

  async getCreatorTemplates(creatorId: string, options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);

    const response = await axios.get(`${API_BASE_URL}/creators/${creatorId}/templates?${params}`);
    return response.data;
  }

  async toggleCreatorFollow(creatorId: string) {
    const response = await axios.post(`${API_BASE_URL}/creators/${creatorId}/follow`);
    return response.data;
  }

  // TEMPLATE COLLECTIONS
  
  async getCollections(filters: any = {}, options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.featured) params.append('featured', 'true');
    if (filters.category) params.append('category', filters.category);
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);

    const response = await axios.get(`${API_BASE_URL}/collections?${params}`);
    return response.data;
  }

  async getCollectionById(collectionId: string) {
    const response = await axios.get(`${API_BASE_URL}/collections/${collectionId}`);
    return response.data;
  }

  async createCollection(collectionData: CollectionData) {
    const response = await axios.post(`${API_BASE_URL}/collections`, collectionData);
    return response.data;
  }

  async addTemplateToCollection(collectionId: string, templateId: string, note?: string) {
    const response = await axios.post(`${API_BASE_URL}/collections/${collectionId}/templates`, {
      templateId,
      note,
    });
    return response.data;
  }

  // MARKETPLACE ANALYTICS
  
  async getTrendingContent() {
    const response = await axios.get(`${API_BASE_URL}/analytics/trending`);
    return response.data;
  }

  async getMarketplaceStats() {
    const response = await axios.get(`${API_BASE_URL}/analytics/stats`);
    return response.data;
  }

  // USER-SPECIFIC ENDPOINTS
  
  async getUserPurchases(options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await axios.get(`${API_BASE_URL}/user/purchases?${params}`);
    return response.data;
  }

  async getUserDownloads(options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await axios.get(`${API_BASE_URL}/user/downloads?${params}`);
    return response.data;
  }

  async getUserLikes(options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await axios.get(`${API_BASE_URL}/user/likes?${params}`);
    return response.data;
  }

  async getUserCollections(options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await axios.get(`${API_BASE_URL}/user/collections?${params}`);
    return response.data;
  }

  // TEMPLATE SUBMISSION WORKFLOW
  
  async getTemplateSubmissions(options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);

    const response = await axios.get(`${API_BASE_URL}/submissions?${params}`);
    return response.data;
  }

  async getTemplateSubmissionById(submissionId: string) {
    const response = await axios.get(`${API_BASE_URL}/submissions/${submissionId}`);
    return response.data;
  }

  async updateTemplateSubmission(submissionId: string, updateData: any) {
    const response = await axios.put(`${API_BASE_URL}/submissions/${submissionId}`, updateData);
    return response.data;
  }

  // CREATOR DASHBOARD
  
  async getCreatorDashboard() {
    const response = await axios.get(`${API_BASE_URL}/creator/dashboard`);
    return response.data;
  }

  async getCreatorAnalytics(templateId?: string, dateRange?: { start: string; end: string }) {
    const params = new URLSearchParams();
    if (templateId) params.append('templateId', templateId);
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }

    const response = await axios.get(`${API_BASE_URL}/creator/analytics?${params}`);
    return response.data;
  }

  async getCreatorRevenue(options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await axios.get(`${API_BASE_URL}/creator/revenue?${params}`);
    return response.data;
  }

  // TEMPLATE CHALLENGES
  
  async getTemplateChallenges(options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await axios.get(`${API_BASE_URL}/challenges?${params}`);
    return response.data;
  }

  async getChallengeById(challengeId: string) {
    const response = await axios.get(`${API_BASE_URL}/challenges/${challengeId}`);
    return response.data;
  }

  async submitToChallenge(challengeId: string, templateId: string, description?: string) {
    const response = await axios.post(`${API_BASE_URL}/challenges/${challengeId}/submit`, {
      templateId,
      description,
    });
    return response.data;
  }

  // ADMIN FUNCTIONS
  
  async approveTemplateSubmission(submissionId: string, notes?: string) {
    const response = await axios.post(`${API_BASE_URL}/admin/submissions/${submissionId}/approve`, {
      notes,
    });
    return response.data;
  }

  async rejectTemplateSubmission(submissionId: string, reason: string) {
    const response = await axios.post(`${API_BASE_URL}/admin/submissions/${submissionId}/reject`, {
      reason,
    });
    return response.data;
  }

  async featureTemplate(templateId: string) {
    const response = await axios.post(`${API_BASE_URL}/admin/templates/${templateId}/feature`);
    return response.data;
  }

  async verifyTemplate(templateId: string) {
    const response = await axios.post(`${API_BASE_URL}/admin/templates/${templateId}/verify`);
    return response.data;
  }

  // REPORTING
  
  async reportTemplate(templateId: string, reason: string, description: string) {
    const response = await axios.post(`${API_BASE_URL}/templates/${templateId}/report`, {
      reason,
      description,
    });
    return response.data;
  }

  async reportReview(reviewId: string, reason: string, description: string) {
    const response = await axios.post(`${API_BASE_URL}/reviews/${reviewId}/report`, {
      reason,
      description,
    });
    return response.data;
  }

  // SEARCH SUGGESTIONS
  
  async getSearchSuggestions(query: string) {
    const response = await axios.get(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getPopularTags() {
    const response = await axios.get(`${API_BASE_URL}/tags/popular`);
    return response.data;
  }

  async getCategories() {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    return response.data;
  }

  async getGenres() {
    const response = await axios.get(`${API_BASE_URL}/genres`);
    return response.data;
  }

  // NOTIFICATIONS
  
  async getNotifications(options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await axios.get(`${API_BASE_URL}/notifications?${params}`);
    return response.data;
  }

  async markNotificationRead(notificationId: string) {
    const response = await axios.post(`${API_BASE_URL}/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await axios.post(`${API_BASE_URL}/notifications/read-all`);
    return response.data;
  }

  // FAVORITES AND WISHLISTS
  
  async addToWishlist(templateId: string) {
    const response = await axios.post(`${API_BASE_URL}/wishlist`, { templateId });
    return response.data;
  }

  async removeFromWishlist(templateId: string) {
    const response = await axios.delete(`${API_BASE_URL}/wishlist/${templateId}`);
    return response.data;
  }

  async getWishlist(options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await axios.get(`${API_BASE_URL}/wishlist?${params}`);
    return response.data;
  }

  // COMPARISON
  
  async compareTemplates(templateIds: string[]) {
    const response = await axios.post(`${API_BASE_URL}/compare`, { templateIds });
    return response.data;
  }

  // EXPORT
  
  async exportTemplateData(templateId: string, format: 'json' | 'xml' | 'docx') {
    const response = await axios.get(`${API_BASE_URL}/templates/${templateId}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // RECOMMENDATIONS
  
  async getRecommendedTemplates(options: Partial<PaginationOptions> = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await axios.get(`${API_BASE_URL}/recommendations?${params}`);
    return response.data;
  }

  async getSimilarTemplates(templateId: string, limit = 5) {
    const response = await axios.get(`${API_BASE_URL}/templates/${templateId}/similar?limit=${limit}`);
    return response.data;
  }
}

export const marketplaceApi = new MarketplaceApiService();