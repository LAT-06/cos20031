import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/services/api";

export const useScoreStore = defineStore("score", () => {
  const scores = ref([]);
  const currentScore = ref(null);
  const stagedScores = ref([]);
  const clubRecords = ref([]);
  const personalBests = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Fetch scores with filters
  async function fetchScores(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/scores?${params}`);
      scores.value = response.data.scores;
      return response.data.scores;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Get score by ID
  async function fetchScoreById(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/scores/${id}`);
      currentScore.value = response.data.score;
      return response.data.score;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Create score
  async function createScore(scoreData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post("/scores", scoreData);
      return response.data.score;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Update score
  async function updateScore(id, scoreData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/scores/${id}`, scoreData);
      return response.data.score;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Approve score
  async function approveScore(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post(`/scores/${id}/approve`);
      return response.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Reject score
  async function rejectScore(id, reason) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post(`/scores/${id}/reject`, { reason });
      return response.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Delete score
  async function deleteScore(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.delete(`/scores/${id}`);
      return response.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch staged scores
  async function fetchStagedScores() {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get("/scores/staged/list");
      stagedScores.value = response.data.scores;
      return response.data.scores;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch club records
  async function fetchClubRecords(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/scores/club-records?${params}`);
      clubRecords.value = response.data.records;
      return response.data.records;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch personal bests
  async function fetchPersonalBests(archerId) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/archers/${archerId}/personal-bests`);
      personalBests.value = response.data.personalBests;
      return response.data.personalBests;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    scores,
    currentScore,
    stagedScores,
    clubRecords,
    personalBests,
    loading,
    error,
    fetchScores,
    fetchScoreById,
    createScore,
    updateScore,
    approveScore,
    rejectScore,
    deleteScore,
    fetchStagedScores,
    fetchClubRecords,
    fetchPersonalBests,
  };
});
