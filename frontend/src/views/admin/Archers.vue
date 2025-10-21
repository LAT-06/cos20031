<template>
  <main>
    <h1>Archers Management</h1>

    <div style="margin-bottom: 24px">
      <div class="container-search">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search archers..."
        />
        <button @click="loadArchers">Search</button>
      </div>

      <div class="container-filter">
        <select v-model="filterRole" @change="loadArchers">
          <option value="">All Roles</option>
          <option value="archer">Archer</option>
          <option value="recorder">Recorder</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div class="container-add">
        <button @click="showAddModal = true">+ Add Archer</button>
      </div>
    </div>

    <div class="container-table">
      <div v-if="loading" class="loading">Loading archers...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <table v-else>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Class</th>
            <th>Division</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="archer in archers" :key="archer.ArcherID">
            <td>{{ archer.FirstName }} {{ archer.LastName }}</td>
            <td>{{ archer.Email }}</td>
            <td>{{ archer.class?.Name || "N/A" }}</td>
            <td>{{ archer.defaultDivision?.Name || "N/A" }}</td>
            <td>
              <span :class="`badge badge-${archer.Role}`">{{
                archer.Role
              }}</span>
            </td>
            <td>
              <button @click="viewArcher(archer)">View</button>
              <button @click="editArcher(archer)">Edit</button>
              <button @click="deleteArcher(archer)" v-if="authStore.isAdmin">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";

const authStore = useAuthStore();

const archers = ref([]);
const loading = ref(false);
const error = ref("");
const searchTerm = ref("");
const filterRole = ref("");
const showAddModal = ref(false);

onMounted(() => {
  loadArchers();
});

async function loadArchers() {
  loading.value = true;
  error.value = "";

  try {
    const params = {};
    if (searchTerm.value) params.search = searchTerm.value;
    if (filterRole.value) params.role = filterRole.value;

    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/archers?${queryString}`);
    archers.value = response.data.archers;
  } catch (err) {
    error.value = err.message || "Failed to load archers";
  } finally {
    loading.value = false;
  }
}

function viewArcher(archer) {
  // TODO: Implement view modal
  alert(`View archer: ${archer.FirstName} ${archer.LastName}`);
}

function editArcher(archer) {
  // TODO: Implement edit modal
  alert(`Edit archer: ${archer.FirstName} ${archer.LastName}`);
}

async function deleteArcher(archer) {
  if (
    !confirm(
      `Are you sure you want to delete ${archer.FirstName} ${archer.LastName}?`
    )
  ) {
    return;
  }

  try {
    await api.delete(`/archers/${archer.ArcherID}`);
    await loadArchers();
    alert("Archer deleted successfully");
  } catch (err) {
    alert(err.message || "Failed to delete archer");
  }
}
</script>
