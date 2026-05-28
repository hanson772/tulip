import { createStore } from 'vuex';
import axios from 'axios';

// Base API URL - change this to match your backend URL
const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api';

// Restore auth header and user data on page refresh
const savedToken = localStorage.getItem('token');
const savedUser = (() => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
})();
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

export default createStore({
  state: {
    user: savedUser,
    token: savedToken,
    posts: [],
    postsLoading: false,
    topics: [],
    topicsLoading: false,
    currentTopic: null,
    currentTopicLoading: false,
    myDrafts: [],
    myDraftsLoading: false,
    myPublished: [],
    myPublishedLoading: false,
    tags: [],
    tagsLoading: false
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    },
    SET_TOKEN(state, token) {
      state.token = token;
      if (token) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    },
    CLEAR_AUTH(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    },
    SET_POSTS(state, posts) {
      state.posts = posts;
    },
    ADD_POST(state, post) {
      state.posts.unshift(post);
    },
    UPDATE_POST(state, updatedPost) {
      const idx = state.posts.findIndex(p => p.id === updatedPost.id);
      if (idx !== -1) {
        state.posts[idx] = updatedPost;
      }
    },
    REMOVE_POST(state, postId) {
      state.posts = state.posts.filter(p => p.id !== postId);
    },
    SET_POSTS_LOADING(state, val) {
      state.postsLoading = val;
    },
    SET_TOPICS(state, topics) {
      state.topics = topics;
    },
    SET_TOPICS_LOADING(state, val) {
      state.topicsLoading = val;
    },
    ADD_TOPIC(state, topic) {
      state.topics.unshift(topic);
    },
    REMOVE_TOPIC(state, topicId) {
      state.topics = state.topics.filter(t => t.id !== topicId);
    },
    UPDATE_TOPIC(state, topic) {
      const idx = state.topics.findIndex(t => t.id === topic.id);
      if (idx !== -1) state.topics[idx] = topic;
      if (state.currentTopic && state.currentTopic.id === topic.id) {
        state.currentTopic = topic;
      }
    },
    SET_CURRENT_TOPIC(state, topic) {
      state.currentTopic = topic;
    },
    SET_CURRENT_TOPIC_LOADING(state, val) {
      state.currentTopicLoading = val;
    },
    ADD_OPINION(state, opinion) {
      if (state.currentTopic) {
        if (!state.currentTopic.opinions) state.currentTopic.opinions = [];
        state.currentTopic.opinions.unshift(opinion);
      }
    },
    REMOVE_OPINION(state, opinionId) {
      if (state.currentTopic && state.currentTopic.opinions) {
        state.currentTopic.opinions = state.currentTopic.opinions.filter(o => o.id !== opinionId);
      }
    },
    UPDATE_OPINION(state, opinion) {
      if (state.currentTopic && state.currentTopic.opinions) {
        const idx = state.currentTopic.opinions.findIndex(o => o.id === opinion.id);
        if (idx !== -1) state.currentTopic.opinions[idx] = opinion;
      }
    },
    SET_USER_SUPPORTED_OPINION_ID(state, opinionId) {
      if (state.currentTopic) {
        state.currentTopic.user_supported_opinion_id = opinionId;
      }
    },
    ADD_COMMENT(state, comment) {
      if (state.currentTopic) {
        if (!state.currentTopic.comments) state.currentTopic.comments = [];
        state.currentTopic.comments.push(comment);
      }
    },
    SET_AVATAR(state, avatar) {
      if (state.user) {
        state.user.avatar = avatar;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    SET_NICKNAME(state, nickname) {
      if (state.user) {
        state.user.nickname = nickname;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    SET_MY_DRAFTS(state, drafts) {
      state.myDrafts = drafts;
    },
    SET_MY_DRAFTS_LOADING(state, val) {
      state.myDraftsLoading = val;
    },
    SET_MY_PUBLISHED(state, published) {
      state.myPublished = published;
    },
    SET_MY_PUBLISHED_LOADING(state, val) {
      state.myPublishedLoading = val;
    },
    SET_TAGS(state, tags) {
      state.tags = tags;
    },
    SET_TAGS_LOADING(state, val) {
      state.tagsLoading = val;
    }
  },
  actions: {
    async login({ commit }, { email, password }) {
      try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, {
          email,
          password
        });

        const { token, ...userData } = response.data;

        commit('SET_USER', userData);
        commit('SET_TOKEN', token);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Login failed'
        };
      }
    },
    async register({ commit }, { name, email, password }) {
      try {
        const response = await axios.post(`${API_BASE_URL}/users/register`, {
          name,
          email,
          password
        });

        const { token, ...userData } = response.data;

        commit('SET_USER', userData);
        commit('SET_TOKEN', token);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Registration failed'
        };
      }
    },
    logout({ commit }) {
      commit('CLEAR_AUTH');
    },
    async fetchPosts({ commit }) {
      commit('SET_POSTS_LOADING', true);
      try {
        const response = await axios.get(`${API_BASE_URL}/posts`);
        commit('SET_POSTS', response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch posts'
        };
      } finally {
        commit('SET_POSTS_LOADING', false);
      }
    },
    async createPost({ commit }, { content }) {
      try {
        const response = await axios.post(`${API_BASE_URL}/posts`, { content });
        commit('ADD_POST', response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create post'
        };
      }
    },
    async updatePost({ commit }, { id, content }) {
      try {
        const response = await axios.put(`${API_BASE_URL}/posts/${id}`, { content });
        commit('UPDATE_POST', response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update post'
        };
      }
    },
    async deletePost({ commit }, id) {
      try {
        await axios.delete(`${API_BASE_URL}/posts/${id}`);
        commit('REMOVE_POST', id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete post'
        };
      }
    },
    async uploadAvatar({ commit }, avatar) {
      try {
        const response = await axios.put(`${API_BASE_URL}/users/avatar`, { avatar });
        commit('SET_AVATAR', response.data.avatar);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to upload avatar'
        };
      }
    },
    async updateProfile({ commit }, { nickname }) {
      try {
        const response = await axios.put(`${API_BASE_URL}/users/profile`, { nickname });
        commit('SET_NICKNAME', response.data.nickname);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update profile'
        };
      }
    },
    // Topics
    async fetchTopics({ commit }, { tag } = {}) {
      commit('SET_TOPICS_LOADING', true);
      try {
        const params = {};
        if (tag) params.tag = tag;
        const response = await axios.get(`${API_BASE_URL}/topics`, { params });
        commit('SET_TOPICS', response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch topics'
        };
      } finally {
        commit('SET_TOPICS_LOADING', false);
      }
    },
    async fetchTopic({ commit }, id) {
      commit('SET_CURRENT_TOPIC_LOADING', true);
      try {
        const response = await axios.get(`${API_BASE_URL}/topics/${id}`);
        commit('SET_CURRENT_TOPIC', response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch topic'
        };
      } finally {
        commit('SET_CURRENT_TOPIC_LOADING', false);
      }
    },
    async createTopic({ commit }, { title, content, deadline, tags }) {
      try {
        const payload = { title, content };
        if (deadline !== undefined) payload.deadline = deadline;
        if (tags !== undefined) payload.tags = tags;
        const response = await axios.post(`${API_BASE_URL}/topics`, payload);
        commit('ADD_TOPIC', response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create topic'
        };
      }
    },
    async deleteTopic({ commit }, id) {
      try {
        await axios.delete(`${API_BASE_URL}/topics/${id}`);
        commit('REMOVE_TOPIC', id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete topic'
        };
      }
    },
    async fetchMyTopics({ commit }) {
      commit('SET_TOPICS_LOADING', true);
      try {
        const response = await axios.get(`${API_BASE_URL}/topics/mine`);
        commit('SET_TOPICS', response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch your topics'
        };
      } finally {
        commit('SET_TOPICS_LOADING', false);
      }
    },
    async publishTopic({ commit }, id) {
      try {
        const response = await axios.post(`${API_BASE_URL}/topics/${id}/publish`);
        commit('UPDATE_TOPIC', response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to publish topic'
        };
      }
    },
    async updateTopic({ commit }, { id, title, content, deadline, tags }) {
      try {
        const payload = { title, content };
        if (deadline !== undefined) payload.deadline = deadline;
        if (tags !== undefined) payload.tags = tags;
        const response = await axios.put(`${API_BASE_URL}/topics/${id}`, payload);
        commit('UPDATE_TOPIC', response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update topic'
        };
      }
    },
    async fetchTags({ commit }) {
      commit('SET_TAGS_LOADING', true);
      try {
        const response = await axios.get(`${API_BASE_URL}/tags`);
        commit('SET_TAGS', response.data);
      } catch (_) {
        // ignore
      } finally {
        commit('SET_TAGS_LOADING', false);
      }
    },
    async createTag({ dispatch }, { name }) {
      try {
        const response = await axios.post(`${API_BASE_URL}/tags`, { name });
        await dispatch('fetchTags');
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create tag'
        };
      }
    },
    async updateTag({ dispatch }, { id, name }) {
      try {
        const response = await axios.put(`${API_BASE_URL}/tags/${id}`, { name });
        await dispatch('fetchTags');
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update tag'
        };
      }
    },
    async deleteTag({ dispatch }, id) {
      try {
        await axios.delete(`${API_BASE_URL}/tags/${id}`);
        await dispatch('fetchTags');
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete tag'
        };
      }
    },
    async fetchMyDrafts({ commit }) {
      commit('SET_MY_DRAFTS_LOADING', true);
      try {
        const response = await axios.get(`${API_BASE_URL}/topics/mine/drafts`);
        commit('SET_MY_DRAFTS', response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch drafts'
        };
      } finally {
        commit('SET_MY_DRAFTS_LOADING', false);
      }
    },
    async fetchMyPublished({ commit }) {
      commit('SET_MY_PUBLISHED_LOADING', true);
      try {
        const response = await axios.get(`${API_BASE_URL}/topics/mine/published`);
        commit('SET_MY_PUBLISHED', response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch published topics'
        };
      } finally {
        commit('SET_MY_PUBLISHED_LOADING', false);
      }
    },
    async createOpinion({ commit }, { topicId, content, visible, selectable }) {
      try {
        const payload = { content };
        if (visible !== undefined) payload.visible = visible;
        if (selectable !== undefined) payload.selectable = selectable;
        const response = await axios.post(`${API_BASE_URL}/topics/${topicId}/opinions`, payload);
        commit('ADD_OPINION', response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create opinion'
        };
      }
    },
    async updateOpinion({ commit }, { topicId, opinionId, content, visible, selectable }) {
      try {
        const payload = {};
        if (content !== undefined) payload.content = content;
        if (visible !== undefined) payload.visible = visible;
        if (selectable !== undefined) payload.selectable = selectable;
        const response = await axios.put(`${API_BASE_URL}/topics/${topicId}/opinions/${opinionId}`, payload);
        commit('UPDATE_OPINION', response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update opinion'
        };
      }
    },
    async deleteOpinion({ commit }, { topicId, opinionId }) {
      try {
        await axios.delete(`${API_BASE_URL}/topics/${topicId}/opinions/${opinionId}`);
        commit('REMOVE_OPINION', opinionId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete opinion'
        };
      }
    },
    async supportOpinion({ commit }, { topicId, opinionId }) {
      try {
        const response = await axios.post(`${API_BASE_URL}/topics/${topicId}/opinions/${opinionId}/support`);
        const { opinion, user_supported_opinion_id } = response.data;
        commit('UPDATE_OPINION', opinion);
        if (user_supported_opinion_id !== undefined) {
          commit('SET_USER_SUPPORTED_OPINION_ID', user_supported_opinion_id);
        }
        return { success: true, data: opinion };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to support opinion'
        };
      }
    },
    async createComment({ commit }, { topicId, content, parentId }) {
      try {
        const payload = { content };
        if (parentId) payload.parentId = parentId;
        const response = await axios.post(`${API_BASE_URL}/topics/${topicId}/comments`, payload);
        commit('ADD_COMMENT', response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create comment'
        };
      }
    }
  },
  getters: {
    isLoggedIn: state => !!state.token,
    currentUser: state => state.user,
    userPosts: state => state.posts,
    postsLoading: state => state.postsLoading,
    topics: state => state.topics,
    topicsLoading: state => state.topicsLoading,
    currentTopic: state => state.currentTopic,
    currentTopicLoading: state => state.currentTopicLoading,
    myDrafts: state => state.myDrafts,
    myDraftsLoading: state => state.myDraftsLoading,
    myPublished: state => state.myPublished,
    myPublishedLoading: state => state.myPublishedLoading,
    tags: state => state.tags
  }
});
