<template>
  <main>
    <h1>Scores Management</h1>

    <div style="margin-bottom: 24px">
      <div class="container-search">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search by archer name..."
          @keyup.enter="loadScores"
        />
        <button @click="loadScores">Search</button>
      </div>

      <div class="container-filter">
        <select v-model="filterStatus" @change="loadScores">
          <option value="">All Status</option>
          <option value="staged">Staged</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          v-model="filterRound"
          @change="loadScores"
          style="margin-left: 12px"
        >
          <option value="">All Rounds</option>
          <option
            v-for="round in rounds"
            :key="round.RoundID"
            :value="round.RoundID"
          >
            {{ round.Name }}
          </option>
        </select>
      </div>
    </div>

    <div class="stats-row" style="margin-bottom: 24px">
      <div class="stat-card">
        <h3>Pending Review</h3>
        <p class="stat-number">{{ stats.pending }}</p>
      </div>
      <div class="stat-card">
        <h3>Approved</h3>
        <p class="stat-number">{{ stats.approved }}</p>
      </div>
      <div class="stat-card">
        <h3>Total Scores</h3>
        <p class="stat-number">{{ stats.total }}</p>
      </div>
    </div>

    <div class="container-table">
      <div v-if="loading" class="loading">Loading scores...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <table v-else>
        <thead>
          <tr>
            <th>Date</th>
            <th>Archer</th>
            <th>Round</th>
            <th>Division</th>
            <th>Equipment</th>
            <th>Total Score</th>
            <th>Hits</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="score in filteredScores"
            :key="score.ScoreRecordID"
            class="table-row"
          >
            <td>{{ formatDate(score.DateShot) }}</td>
            <td>{{ score.archer.FirstName }} {{ score.archer.LastName }}</td>
            <td>{{ score.round.Name }}</td>
            <td>{{ score.division?.Name || "N/A" }}</td>
            <td>
              <span :class="score.EquipmentUsed !== score.division?.Name ? 'equipment-mismatch' : ''">
                {{ score.EquipmentUsed || score.division?.Name || "N/A" }}
              </span>
            </td>
            <td>
              <strong>{{ score.TotalScore }}</strong>
            </td>
            <td>{{ score.TotalHits }}</td>
            <td>
              <span :class="`badge badge-${score.Status}`">
                {{ score.Status }}
              </span>
            </td>
            <td>
              <button class="btn-small btn-info" @click="viewScore(score)">
                View
              </button>
              <button
                v-if="score.Status === 'pending'"
                class="btn-small btn-success"
                @click="approveScore(score)"
              >
                Approve
              </button>
              <button
                v-if="score.Status === 'pending'"
                class="btn-small btn-danger"
                @click="rejectScore(score)"
              >
                Reject
              </button>
              <button
                class="btn-small btn-warning"
                @click="editStatus(score)"
                style="margin-left: 4px"
              >
                Edit Status
              </button>
              <button
                v-if="authStore.isAdmin"
                class="btn-small btn-danger"
                @click="deleteScore(score)"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="scores.length === 0">
            <td colspan="8" style="text-align: center; padding: 40px">
              No scores found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- View Score Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>Score Details</h2>
          <button class="close-btn" @click="closeViewModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedScore">
          <div class="score-header">
            <div class="detail-item">
              <label>Archer:</label>
              <span
                >{{ selectedScore.archer.FirstName }}
                {{ selectedScore.archer.LastName }}</span
              >
            </div>
            <div class="detail-item">
              <label>Date Shot:</label>
              <span>{{ formatDate(selectedScore.DateShot) }}</span>
            </div>
            <div class="detail-item">
              <label>Round:</label>
              <span>{{ selectedScore.round.Name }}</span>
            </div>
            <div class="detail-item">
              <label>Division:</label>
              <span>{{ selectedScore.division?.Name || "N/A" }}</span>
            </div>
            <div class="detail-item">
              <label>Total Score:</label>
              <span class="big-score">{{ selectedScore.TotalScore }}</span>
            </div>
            <div class="detail-item">
              <label>Total Hits:</label>
              <span>{{ selectedScore.TotalHits }}</span>
            </div>
            <div class="detail-item">
              <label>Status:</label>
              <span :class="`badge badge-${selectedScore.Status}`">{{
                selectedScore.Status
              }}</span>
            </div>
          </div>

          <div v-if="scoreDetails.length > 0" class="ends-section">
            <h3>Ends & Arrows</h3>
            <div v-for="end in scoreDetails" :key="end.EndID" class="end-card">
              <div class="end-header">
                <strong>End {{ end.EndNumber }}</strong>
                <span>Score: {{ end.EndScore }} | Hits: {{ end.EndHits }}</span>
              </div>
              <div class="arrows-grid">
                <div
                  v-for="arrow in end.arrows"
                  :key="arrow.ArrowID"
                  class="arrow-badge"
                >
                  {{ arrow.Score }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeViewModal">
            Close
          </button>
          <button
            v-if="selectedScore?.Status === 'pending'"
            class="btn btn-success"
            @click="approveScore(selectedScore)"
          >
            Approve
          </button>
          <button
            v-if="selectedScore?.Status === 'pending'"
            class="btn btn-danger"
            @click="rejectScore(selectedScore)"
          >
            Reject
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Status Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Score Status</h2>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">
          <div class="score-info">
            <p>
              <strong>Archer:</strong> {{ editingScore?.archer.FirstName }}
              {{ editingScore?.archer.LastName }}
            </p>
            <p><strong>Round:</strong> {{ editingScore?.round.Name }}</p>
            <p><strong>Score:</strong> {{ editingScore?.TotalScore }}</p>
            <p>
              <strong>Current Status:</strong>
              <span :class="`badge badge-${editingScore?.Status}`">{{
                editingScore?.Status
              }}</span>
            </p>
          </div>

          <div class="form-group">
            <label>Change Status To:</label>
            <select v-model="newStatus" required>
              <option value="staged">Staged</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div v-if="newStatus === 'rejected'" class="form-group">
            <label>Rejection Reason (required for rejected status):</label>
            <textarea
              v-model="rejectionReason"
              rows="3"
              placeholder="Enter reason for rejection..."
              required
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditModal">
            Cancel
          </button>
          <button
            class="btn btn-primary"
            @click="saveStatus"
            :disabled="
              !newStatus || (newStatus === 'rejected' && !rejectionReason)
            "
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";

const authStore = useAuthStore();

const scores = ref([]);
const rounds = ref([]);
const loading = ref(false);
const error = ref("");
const searchTerm = ref("");
const filterStatus = ref("");
const filterRound = ref("");

const showViewModal = ref(false);
const selectedScore = ref(null);
const scoreDetails = ref([]);

const showEditModal = ref(false);
const editingScore = ref(null);
const newStatus = ref("");
const rejectionReason = ref("");

const stats = computed(() => {
  return {
    pending: scores.value.filter((s) => s.Status === "pending").length,
    approved: scores.value.filter((s) => s.Status === "approved").length,
    total: scores.value.length,
  };
});

const filteredScores = computed(() => {
  return scores.value;
});

onMounted(() => {
  loadScores();
  loadRounds();
});

async function loadScores() {
  loading.value = true;
  error.value = "";

  try {
    const params = {};
    if (searchTerm.value) params.search = searchTerm.value;
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterRound.value) params.roundId = filterRound.value;

    const response = await api.get("/scores", { params });
    scores.value = response.data.scores;
  } catch (err) {
    error.value = err.response?.data?.error || "Failed to load scores";
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

async function viewScore(score) {
  selectedScore.value = score;

  // Load detailed end/arrow data
  try {
    const response = await api.get(`/scores/${score.ScoreRecordID}`);
    scoreDetails.value = response.data.score.ends || [];
  } catch (err) {
    console.error("Failed to load score details:", err);
    scoreDetails.value = [];
  }

  showViewModal.value = true;
}

async function approveScore(score) {
  if (
    !confirm(
      `Approve score of ${score.TotalScore} for ${score.archer.FirstName} ${score.archer.LastName}?`
    )
  ) {
    return;
  }

  try {
    await api.post(`/scores/${score.ScoreRecordID}/approve`);
    await loadScores();
    closeViewModal();
  } catch (err) {
    alert(err.response?.data?.error || "Failed to approve score");
  }
}

async function rejectScore(score) {
  const reason = prompt("Enter rejection reason (optional):");
  if (reason === null) return; // User cancelled

  try {
    await api.post(`/scores/${score.ScoreRecordID}/reject`, { reason });
    await loadScores();
    closeViewModal();
  } catch (err) {
    alert(err.response?.data?.error || "Failed to reject score");
  }
}

async function deleteScore(score) {
  if (
    !confirm(
      `Are you sure you want to delete this score?\n\nArcher: ${score.archer.FirstName} ${score.archer.LastName}\nScore: ${score.TotalScore}\n\nThis cannot be undone.`
    )
  ) {
    return;
  }

  try {
    await api.delete(`/scores/${score.ScoreRecordID}`);
    await loadScores();
    closeViewModal();
  } catch (err) {
    alert(err.response?.data?.error || "Failed to delete score");
  }
}

function closeViewModal() {
  showViewModal.value = false;
  selectedScore.value = null;
  scoreDetails.value = [];
}

function editStatus(score) {
  console.log("Edit Status clicked for score:", score);
  editingScore.value = score;
  newStatus.value = score.Status;
  rejectionReason.value = "";
  showEditModal.value = true;
  console.log("showEditModal set to:", showEditModal.value);
}

function closeEditModal() {
  showEditModal.value = false;
  editingScore.value = null;
  newStatus.value = "";
  rejectionReason.value = "";
}

async function saveStatus() {
  if (!newStatus.value) {
    alert("Please select a status");
    return;
  }

  if (newStatus.value === "rejected" && !rejectionReason.value.trim()) {
    alert("Rejection reason is required");
    return;
  }

  try {
    const payload = {
      status: newStatus.value,
    };

    if (newStatus.value === "rejected" && rejectionReason.value) {
      payload.reason = rejectionReason.value;
    }

    await api.put(
      `/scores/${editingScore.value.ScoreRecordID}/status`,
      payload
    );
    alert("Status updated successfully");
    closeEditModal();
    await loadScores();
  } catch (err) {
    alert(err.response?.data?.error || "Failed to update status");
  }
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--card-background);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--muted-text);
  text-transform: uppercase;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  margin: 0;
  color: var(--primary-color);
}

.modal-content.large {
  max-width: 900px;
}

.score-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border-color);
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

.big-score {
  font-size: 32px !important;
  font-weight: bold !important;
  color: var(--primary-color) !important;
}

.ends-section {
  margin-top: 20px;
}

.ends-section h3 {
  margin-bottom: 16px;
}

.end-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.end-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.arrows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
}

.arrow-badge {
  background: var(--primary-color);
  color: white;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
}

.btn-small {
  padding: 6px 12px;
  font-size: 14px;
  margin-right: 8px;
}

.btn-info {
  background: #17a2b8;
}

.btn-success {
  background: #28a745;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-danger {
  background: #dc3545;
}

.badge-staged {
  background: #6c757d;
  color: #ffffff;
}

.badge-pending {
  background: #ffc107;
  color: #000;
}

.badge-approved {
  background: #28a745;
}

.badge-rejected {
  background: #dc3545;
}

.equipment-mismatch {
  color: #ffc107;
  font-weight: 600;
}

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

.score-info {
  background: #2d2d2d;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.score-info p {
  margin: 0.5rem 0;
  color: #ffffff;
}

.score-info strong {
  color: #ffffff;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #ffffff;
  font-size: 1rem;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #444;
  border-radius: 4px;
  color: #000000;
  font-size: 1rem;
  font-family: inherit;
}

.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4caf50;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #444;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
