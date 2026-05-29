import { createStore } from "vuex";
import axios from "axios";

// Base API URL - change this to match your backend URL
const API_BASE_URL = process.env.VUE_APP_API_URL || "/api";

// Restore auth header and user data on page refresh
const savedToken = localStorage.getItem("token");
const savedUser = (() => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();
if (savedToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

export default createStore({
  state: {
    user: savedUser,
    token: savedToken,
    topics: [],
    topicsLoading: false,
    currentTopic: null,
    currentTopicLoading: false,
    myDrafts: [],
    myDraftsLoading: false,
    myPublished: [],
    myPublishedLoading: false,
    myFavorites: [],
    myFavoritesLoading: false,
    myParticipated: [],
    myParticipatedLoading: false,
    tags: [],
    tagsLoading: false,
    captchaSvg: null,
    captchaId: null,
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    },
    SET_TOKEN(state, token) {
      state.token = token;
      if (token) {
        localStorage.setItem("token", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else {
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
      }
    },
    CLEAR_AUTH(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
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
      state.topics = state.topics.filter((t) => t.id !== topicId);
    },
    UPDATE_TOPIC(state, topic) {
      const idx = state.topics.findIndex((t) => t.id === topic.id);
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
        state.currentTopic.opinions = state.currentTopic.opinions.filter(
          (o) => o.id !== opinionId,
        );
      }
    },
    UPDATE_OPINION(state, opinion) {
      if (state.currentTopic && state.currentTopic.opinions) {
        const idx = state.currentTopic.opinions.findIndex(
          (o) => o.id === opinion.id,
        );
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
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    SET_NICKNAME(state, nickname) {
      if (state.user) {
        state.user.nickname = nickname;
        localStorage.setItem("user", JSON.stringify(state.user));
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
    SET_MY_FAVORITES(state, topics) {
      state.myFavorites = topics;
    },
    SET_MY_FAVORITES_LOADING(state, val) {
      state.myFavoritesLoading = val;
    },
    SET_MY_PARTICIPATED(state, topics) {
      state.myParticipated = topics;
    },
    SET_MY_PARTICIPATED_LOADING(state, val) {
      state.myParticipatedLoading = val;
    },
    SET_TAGS(state, tags) {
      state.tags = tags;
    },
    SET_TAGS_LOADING(state, val) {
      state.tagsLoading = val;
    },
    SET_CAPTCHA(state, { requestId, svg }) {
      state.captchaId = requestId;
      state.captchaSvg = svg;
    },
    CLEAR_CAPTCHA(state) {
      state.captchaId = null;
      state.captchaSvg = null;
    },
  },
  actions: {
    async fetchCaptcha({ commit }) {
      try {
        const response = await axios.get(`/console/captcha`);
        commit("SET_CAPTCHA", response.data);
        return { success: true };
      } catch (_) {
        return { success: false };
      }
    },
    async login({ commit }, { email, password, captchaId, captchaCode }) {
      try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, {
          email,
          password,
          captchaId,
          captchaCode,
        });

        const { token, ...userData } = response.data;

        commit("SET_USER", userData);
        commit("SET_TOKEN", token);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Login failed",
        };
      }
    },
    async register({ commit }, { name, email, password }) {
      try {
        const response = await axios.post(`${API_BASE_URL}/users/register`, {
          name,
          email,
          password,
        });

        const { token, ...userData } = response.data;

        commit("SET_USER", userData);
        commit("SET_TOKEN", token);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Registration failed",
        };
      }
    },
    logout({ commit }) {
      commit("CLEAR_AUTH");
    },
    async uploadAvatar({ commit }, avatar) {
      try {
        const response = await axios.put(`${API_BASE_URL}/users/avatar`, {
          avatar,
        });
        commit("SET_AVATAR", response.data.avatar);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to upload avatar",
        };
      }
    },
    async updateProfile({ commit }, { nickname }) {
      try {
        const response = await axios.put(`${API_BASE_URL}/users/profile`, {
          nickname,
        });
        commit("SET_NICKNAME", response.data.nickname);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to update profile",
        };
      }
    },
    // Topics
    async fetchTopics({ commit }, { tag } = {}) {
      commit("SET_TOPICS_LOADING", true);
      try {
        const params = {};
        if (tag) params.tag = tag;
        const response = await axios.get(`${API_BASE_URL}/topics`, { params });
        commit("SET_TOPICS", response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to fetch topics",
        };
      } finally {
        commit("SET_TOPICS_LOADING", false);
      }
    },
    async fetchTopic({ commit }, id) {
      commit("SET_CURRENT_TOPIC_LOADING", true);
      try {
        const response = await axios.get(`${API_BASE_URL}/topics/${id}`);
        commit("SET_CURRENT_TOPIC", response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to fetch topic",
        };
      } finally {
        commit("SET_CURRENT_TOPIC_LOADING", false);
      }
    },
    async createTopic({ commit }, { title, content, deadline, tags }) {
      try {
        const payload = { title, content };
        if (deadline !== undefined) payload.deadline = deadline;
        if (tags !== undefined) payload.tags = tags;
        const response = await axios.post(`${API_BASE_URL}/topics`, payload);
        commit("ADD_TOPIC", response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to create topic",
        };
      }
    },
    async deleteTopic({ commit }, id) {
      try {
        await axios.delete(`${API_BASE_URL}/topics/${id}`);
        commit("REMOVE_TOPIC", id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to delete topic",
        };
      }
    },
    async fetchMyTopics({ commit }) {
      commit("SET_TOPICS_LOADING", true);
      try {
        const response = await axios.get(`${API_BASE_URL}/topics/mine`);
        commit("SET_TOPICS", response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message:
            error.response?.data?.message || "Failed to fetch your topics",
        };
      } finally {
        commit("SET_TOPICS_LOADING", false);
      }
    },
    async publishTopic({ commit }, id) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/topics/${id}/publish`,
        );
        commit("UPDATE_TOPIC", response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to publish topic",
        };
      }
    },
    async updateTopic({ commit }, { id, title, content, deadline, tags }) {
      try {
        const payload = { title, content };
        if (deadline !== undefined) payload.deadline = deadline;
        if (tags !== undefined) payload.tags = tags;
        const response = await axios.put(
          `${API_BASE_URL}/topics/${id}`,
          payload,
        );
        commit("UPDATE_TOPIC", response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to update topic",
        };
      }
    },
    async fetchTags({ commit }) {
      commit("SET_TAGS_LOADING", true);
      try {
        const response = await axios.get(`${API_BASE_URL}/tags`);
        commit("SET_TAGS", response.data);
      } catch (_) {
        // ignore
      } finally {
        commit("SET_TAGS_LOADING", false);
      }
    },
    async createTag({ dispatch }, { name }) {
      try {
        const response = await axios.post(`${API_BASE_URL}/tags`, { name });
        await dispatch("fetchTags");
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to create tag",
        };
      }
    },
    async updateTag({ dispatch }, { id, name }) {
      try {
        const response = await axios.put(`${API_BASE_URL}/tags/${id}`, {
          name,
        });
        await dispatch("fetchTags");
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to update tag",
        };
      }
    },
    async deleteTag({ dispatch }, id) {
      try {
        await axios.delete(`${API_BASE_URL}/tags/${id}`);
        await dispatch("fetchTags");
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to delete tag",
        };
      }
    },
    async fetchMyDrafts({ commit }) {
      commit("SET_MY_DRAFTS_LOADING", true);
      try {
        const response = await axios.get(`${API_BASE_URL}/topics/mine/drafts`);
        commit("SET_MY_DRAFTS", response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to fetch drafts",
        };
      } finally {
        commit("SET_MY_DRAFTS_LOADING", false);
      }
    },
    async fetchMyPublished({ commit }) {
      commit("SET_MY_PUBLISHED_LOADING", true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/topics/mine/published`,
        );
        commit("SET_MY_PUBLISHED", response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message:
            error.response?.data?.message || "Failed to fetch published topics",
        };
      } finally {
        commit("SET_MY_PUBLISHED_LOADING", false);
      }
    },
    async fetchMyFavorites({ commit }) {
      commit("SET_MY_FAVORITES_LOADING", true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/topics/mine/favorites`,
        );
        commit("SET_MY_FAVORITES", response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to fetch favorites",
        };
      } finally {
        commit("SET_MY_FAVORITES_LOADING", false);
      }
    },
    async fetchMyParticipated({ commit }) {
      commit("SET_MY_PARTICIPATED_LOADING", true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/topics/mine/participated`,
        );
        commit("SET_MY_PARTICIPATED", response.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message:
            error.response?.data?.message ||
            "Failed to fetch participated topics",
        };
      } finally {
        commit("SET_MY_PARTICIPATED_LOADING", false);
      }
    },
    async createOpinion({ commit }, { topicId, content, visible, selectable }) {
      try {
        const payload = { content };
        if (visible !== undefined) payload.visible = visible;
        if (selectable !== undefined) payload.selectable = selectable;
        const response = await axios.post(
          `${API_BASE_URL}/topics/${topicId}/opinions`,
          payload,
        );
        commit("ADD_OPINION", response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to create opinion",
        };
      }
    },
    async updateOpinion(
      { commit },
      { topicId, opinionId, content, visible, selectable },
    ) {
      try {
        const payload = {};
        if (content !== undefined) payload.content = content;
        if (visible !== undefined) payload.visible = visible;
        if (selectable !== undefined) payload.selectable = selectable;
        const response = await axios.put(
          `${API_BASE_URL}/topics/${topicId}/opinions/${opinionId}`,
          payload,
        );
        commit("UPDATE_OPINION", response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to update opinion",
        };
      }
    },
    async deleteOpinion({ commit }, { topicId, opinionId }) {
      try {
        await axios.delete(
          `${API_BASE_URL}/topics/${topicId}/opinions/${opinionId}`,
        );
        commit("REMOVE_OPINION", opinionId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to delete opinion",
        };
      }
    },
    async supportOpinion({ commit }, { topicId, opinionId }) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/topics/${topicId}/opinions/${opinionId}/support`,
        );
        const { opinion, user_supported_opinion_id } = response.data;
        commit("UPDATE_OPINION", opinion);
        if (user_supported_opinion_id !== undefined) {
          commit("SET_USER_SUPPORTED_OPINION_ID", user_supported_opinion_id);
        }
        return { success: true, data: opinion };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to support opinion",
        };
      }
    },
    async createComment({ commit }, { topicId, content, parentId }) {
      try {
        const payload = { content };
        if (parentId) payload.parentId = parentId;
        const response = await axios.post(
          `${API_BASE_URL}/topics/${topicId}/comments`,
          payload,
        );
        commit("ADD_COMMENT", response.data);
        return { success: true, data: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to create comment",
        };
      }
    },
    async checkFavorite({}, topicId) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/favorites/${topicId}`,
        );
        return { success: true, favorited: response.data.favorited };
      } catch (error) {
        return { success: false, favorited: false };
      }
    },
    async toggleFavorite({}, topicId) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/favorites/${topicId}`,
        );
        return { success: true, favorited: response.data.favorited };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to toggle favorite",
        };
      }
    },
  },
  getters: {
    isLoggedIn: (state) => !!state.token,
    currentUser: (state) => state.user,
    topics: (state) => state.topics,
    topicsLoading: (state) => state.topicsLoading,
    currentTopic: (state) => state.currentTopic,
    currentTopicLoading: (state) => state.currentTopicLoading,
    myDrafts: (state) => state.myDrafts,
    myDraftsLoading: (state) => state.myDraftsLoading,
    myPublished: (state) => state.myPublished,
    myPublishedLoading: (state) => state.myPublishedLoading,
    myFavorites: (state) => state.myFavorites,
    myFavoritesLoading: (state) => state.myFavoritesLoading,
    myParticipated: (state) => state.myParticipated,
    myParticipatedLoading: (state) => state.myParticipatedLoading,
    tags: (state) => state.tags,
    currentUserRoles: (state) => state.user?.roles || [],
    hasRole: (state) => (roleName) =>
      (state.user?.roles || []).includes(roleName),
  },
});
