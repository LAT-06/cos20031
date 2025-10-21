import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/services/api";

export const useMetadataStore = defineStore("metadata", () => {
  const classes = ref([]);
  const divisions = ref([]);
  const categories = ref([]);
  const rounds = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Fetch all classes
  async function fetchClasses() {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get("/classes");
      classes.value = response.data.classes;
      return response.data.classes;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch all divisions
  async function fetchDivisions() {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get("/divisions");
      divisions.value = response.data.divisions;
      return response.data.divisions;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch all categories
  async function fetchCategories() {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get("/categories");
      categories.value = response.data.categories;
      return response.data.categories;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch all rounds
  async function fetchRounds() {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get("/rounds");
      rounds.value = response.data.rounds;
      return response.data.rounds;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch round by ID
  async function fetchRoundById(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/rounds/${id}`);
      return response.data.round;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Initialize all metadata
  async function initializeMetadata() {
    await Promise.all([
      fetchClasses(),
      fetchDivisions(),
      fetchCategories(),
      fetchRounds(),
    ]);
  }

  return {
    classes,
    divisions,
    categories,
    rounds,
    loading,
    error,
    fetchClasses,
    fetchDivisions,
    fetchCategories,
    fetchRounds,
    fetchRoundById,
    initializeMetadata,
  };
});
