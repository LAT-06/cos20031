<template>
  <main>
    <h1>Competitions Management</h1>

    <div style="margin-bottom: 24px">
      <div class="container-search">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search competitions..."
          @keyup.enter="loadCompetitions"
        />
        <button @click="loadCompetitions">Search</button>
      </div>

      <div class="container-add">
        <button @click="openAddModal">+ Add Competition</button>
      </div>
    </div>

    <div class="container-table">
      <div v-if="loading" class="loading">Loading competitions...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <table v-else>
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Location</th>
            <th>Round</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="comp in competitions" :key="comp.CompetitionID">
            <td>
              <strong>{{ comp.Name }}</strong>
            </td>
            <td>{{ formatDate(comp.Date) }}</td>
            <td>{{ comp.Location || "N/A" }}</td>
            <td>{{ comp.round?.Name || "N/A" }}</td>
            <td>
              <span :class="`badge badge-${comp.Status}`">
                {{ comp.Status }}
              </span>
            </td>
            <td>
              <button class="btn-small btn-info" @click="viewCompetition(comp)">
                View
              </button>
              <button
                class="btn-small btn-warning"
                @click="editCompetition(comp)"
              >
                Edit
              </button>
              <button
                class="btn-small btn-danger"
                @click="deleteCompetition(comp)"
                v-if="authStore.isAdmin"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="competitions.length === 0">
            <td colspan="6" style="text-align: center; padding: 40px">
              No competitions found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- View Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Competition Details</h2>
          <button class="close-btn" @click="closeViewModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedCompetition">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Name:</label>
              <span>{{ selectedCompetition.Name }}</span>
            </div>
            <div class="detail-item">
              <label>Date:</label>
              <span>{{ formatDate(selectedCompetition.Date) }}</span>
            </div>
            <div class="detail-item">
              <label>Location:</label>
              <span>{{ selectedCompetition.Location || "N/A" }}</span>
            </div>
            <div class="detail-item">
              <label>Round:</label>
              <span>{{ selectedCompetition.round?.Name || "N/A" }}</span>
            </div>
            <div v-if="selectedCompetition.round?.ranges && selectedCompetition.round.ranges.length > 0" class="detail-item" style="grid-column: 1 / -1">
              <label>Round Details:</label>
              <div style="margin-top:8px">
                <div v-for="range in selectedCompetition.round.ranges" :key="range.RoundRangeID" style="padding:8px 0; border-bottom:1px dashed var(--muted);">
                  <div><strong>Range {{ range.RangeNo }}:</strong></div>
                  <div style="font-size:0.95rem; color:#ffffff;">
                    Distance: {{ range.Distance }}m • Target: {{ range.TargetFace }} • Ends: {{ range.Ends }} • Scoring: {{ range.ScoringType || 'N/A' }} • Arrows/end: {{ range.ArrowsPerEnd || 'N/A' }}
                  </div>
                </div>
              </div>
            </div>
            <div class="detail-item">
              <label>Status:</label>
              <span :class="`badge badge-${selectedCompetition.Status}`">
                {{ selectedCompetition.Status }}
              </span>
            </div>
            <div class="detail-item" style="grid-column: 1 / -1">
              <label>Description:</label>
              <span>{{ selectedCompetition.Description || "N/A" }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeViewModal">
            Close
          </button>
          <button
            class="btn btn-primary"
            @click="editCompetition(selectedCompetition)"
          >
            Edit
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showFormModal" class="modal-overlay" @click="closeFormModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? "Edit" : "Add" }} Competition</h2>
          <button class="close-btn" @click="closeFormModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveCompetition">
            <div class="form-group">
              <label for="name">Competition Name *</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                placeholder="e.g., Summer Championships 2025"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="date">Date *</label>
                <input id="date" v-model="formData.date" type="date" required />
              </div>
              <div class="form-group">
                <label for="status">Status *</label>
                <select id="status" v-model="formData.status" required>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="location">Location</label>
              <input
                id="location"
                v-model="formData.location"
                type="text"
                placeholder="e.g., City Sports Complex"
              />
            </div>

            <div class="form-group">
              <label for="roundId">Round *</label>
              <select id="roundId" v-model="formData.roundId" required>
                <option value="">Select a round</option>
                <option
                  v-for="round in rounds"
                  :key="round.RoundID"
                  :value="round.RoundID"
                >
                  {{ round.Name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                v-model="formData.description"
                rows="4"
                placeholder="Optional description of the competition"
              ></textarea>
            </div>

            <div v-if="formError" class="error-message">{{ formError }}</div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeFormModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="formLoading"
              >
                {{
                  formLoading ? "Saving..." : isEditMode ? "Update" : "Create"
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";

const authStore = useAuthStore();

const competitions = ref([]);
const rounds = ref([]);
const loading = ref(false);
const error = ref("");
const searchTerm = ref("");

// Modals
const showViewModal = ref(false);
const showFormModal = ref(false);
const selectedCompetition = ref(null);
const isEditMode = ref(false);

// Form
const formData = ref({
  name: "",
  date: "",
  location: "",
  roundId: "",
  status: "upcoming",
  description: "",
});
const formLoading = ref(false);
const formError = ref("");

onMounted(() => {
  loadCompetitions();
  loadRounds();
});

async function loadCompetitions() {
  loading.value = true;
  error.value = "";

  try {
    const params = {};
    if (searchTerm.value) params.search = searchTerm.value;

    const response = await api.get("/competitions", { params });
    competitions.value = response.data.competitions;
  } catch (err) {
    error.value = err.response?.data?.error || "Failed to load competitions";
  } finally {
    loading.value = false;
  }
}

async function loadRounds() {
  try {
    const response = await api.get("/rounds");
    rounds.value = response.data.rounds;
  } catch (err) {
    console.error("Failed to load rounds:", err);
  }
}

function openAddModal() {
  isEditMode.value = false;
  formData.value = {
    name: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    roundId: "",
    status: "upcoming",
    description: "",
  };
  formError.value = "";
  showFormModal.value = true;
}

function viewCompetition(comp) {
  selectedCompetition.value = comp;
  showViewModal.value = true;
}

function editCompetition(comp) {
  isEditMode.value = true;
  selectedCompetition.value = comp;
  formData.value = {
    name: comp.Name,
    date: comp.Date,
    location: comp.Location || "",
    roundId: comp.RoundID,
    status: comp.Status,
    description: comp.Description || "",
  };
  formError.value = "";
  showViewModal.value = false;
  showFormModal.value = true;
}

async function saveCompetition() {
  formLoading.value = true;
  formError.value = "";

  try {
    const payload = {
      name: formData.value.name,
      date: formData.value.date,
      location: formData.value.location,
      roundId: formData.value.roundId,
      status: formData.value.status,
      description: formData.value.description,
    };

    if (isEditMode.value) {
      await api.put(
        `/competitions/${selectedCompetition.value.CompetitionID}`,
        payload
      );
    } else {
      await api.post("/competitions", payload);
    }

    await loadCompetitions();
    closeFormModal();
  } catch (err) {
    formError.value =
      err.response?.data?.error ||
      `Failed to ${isEditMode.value ? "update" : "create"} competition`;
  } finally {
    formLoading.value = false;
  }
}

async function deleteCompetition(comp) {
  if (
    !confirm(
      `Are you sure you want to delete "${comp.Name}"?\n\nThis cannot be undone.`
    )
  ) {
    return;
  }

  try {
    await api.delete(`/competitions/${comp.CompetitionID}`);
    await loadCompetitions();
  } catch (err) {
    alert(err.response?.data?.error || "Failed to delete competition");
  }
}

function closeViewModal() {
  showViewModal.value = false;
  selectedCompetition.value = null;
}

function closeFormModal() {
  showFormModal.value = false;
  selectedCompetition.value = null;
  formError.value = "";
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  color: #ffffff;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #444;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #ffffff;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #ffffff;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--primary-color);
}

.modal-body {
  padding: 24px;
  color: #ffffff;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #444;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-weight: 600;
  color: #aaaaaa;
  font-size: 14px;
}

.detail-item span {
  font-size: 16px;
  color: #ffffff;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.btn-small {
  padding: 6px 12px;
  font-size: 14px;
  margin-right: 8px;
}

.btn-info {
  background: #17a2b8;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-danger {
  background: #dc3545;
}

.badge-upcoming {
  background: #17a2b8;
}

.badge-ongoing {
  background: #28a745;
}

.badge-completed {
  background: #6c757d;
}

.badge-cancelled {
  background: #dc3545;
}

@media (max-width: 768px) {
  .detail-grid,
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
