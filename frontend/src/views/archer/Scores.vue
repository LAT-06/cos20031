<template>
  <main>
    <h1>My Scores</h1>

    <div class="stats-row" style="margin-bottom: 24px">
      <div class="stat-card">
        <h3>Total Scores</h3>
        <p class="stat-number">{{ scores.length }}</p>
      </div>
      <div class="stat-card">
        <h3>Approved</h3>
        <p class="stat-number">{{ stats.approved }}</p>
      </div>
      <div class="stat-card">
        <h3>Pending</h3>
        <p class="stat-number">{{ stats.pending }}</p>
      </div>
      <div class="stat-card">
        <h3>Best Score</h3>
        <p class="stat-number">{{ stats.bestScore }}</p>
      </div>
    </div>

    <div style="margin-bottom: 24px">
      <div class="container-filter">
        <select v-model="filterStatus" @change="loadScores">
          <option value="">All Status</option>
          <option value="staged">Staged</option>
          <option value="pending">Pending Review</option>
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

    <div class="container-table">
      <div v-if="loading" class="loading">Loading your scores...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <table v-else-if="scores.length > 0">
        <thead>
          <tr>
            <th>Date</th>
            <th>Round</th>
            <th>Division</th>
            <th>Total Score</th>
            <th>Hits</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="score in scores" :key="score.ScoreRecordID">
            <td>{{ formatDate(score.DateShot) }}</td>
            <td>{{ score.round.Name }}</td>
            <td>{{ score.division?.Name || "N/A" }}</td>
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
                v-if="score.Status === 'rejected'"
                class="btn-small btn-danger"
                @click="deleteScore(score)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <p>No scores found. Start by entering your first score!</p>
        <button
          class="btn btn-primary"
          @click="$router.push('/archer/score-entry')"
        >
          Enter New Score
        </button>
      </div>
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
              <label>Competition:</label>
              <span>{{ selectedScore.competition?.Name || "Practice" }}</span>
            </div>
          </div>

          <div class="score-summary">
            <div class="summary-item">
              <label>Total Score:</label>
              <span class="score-value">{{ selectedScore.TotalScore }}</span>
            </div>
            <div class="summary-item">
              <label>Total Hits:</label>
              <span>{{ selectedScore.TotalHits }}</span>
            </div>
            <div class="summary-item">
              <label>Status:</label>
              <span :class="`badge badge-${selectedScore.Status}`">
                {{ selectedScore.Status }}
              </span>
            </div>
          </div>

          <div
            v-if="selectedScore.Status === 'approved' && selectedScore.approver"
            class="approval-info"
          >
            <p>
              <strong>Approved by:</strong>
              {{ selectedScore.approver.FirstName }}
              {{ selectedScore.approver.LastName }}
            </p>
            <p v-if="selectedScore.ApprovedAt">
              <strong>Approved on:</strong>
              {{ formatDate(selectedScore.ApprovedAt) }}
            </p>
          </div>

          <div
            v-if="selectedScore.Status === 'rejected' && selectedScore.Notes"
            class="rejection-info"
          >
            <p><strong>Rejection Reason:</strong></p>
            <p>{{ selectedScore.Notes }}</p>
          </div>

          <div v-if="scoreDetails.length > 0" class="ends-table">
            <h3>End-by-End Breakdown</h3>
            <table>
              <thead>
                <tr>
                  <th>End</th>
                  <th>Arrows</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="end in scoreDetails" :key="end.EndNumber">
                  <td>{{ end.EndNumber }}</td>
                  <td>{{ end.Arrows.join(", ") }}</td>
                  <td>
                    <strong>{{ end.EndScore }}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="selectedScore.Notes && selectedScore.Status !== 'rejected'"
            class="notes-section"
          >
            <h3>Notes</h3>
            <p>{{ selectedScore.Notes }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeViewModal">
            Close
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
const filterStatus = ref("");
const filterRound = ref("");

const showViewModal = ref(false);
const selectedScore = ref(null);
const scoreDetails = ref([]);

const stats = computed(() => {
  return {
    pending: scores.value.filter((s) => s.Status === "pending").length,
    approved: scores.value.filter((s) => s.Status === "approved").length,
    bestScore:
      scores.value.length > 0
        ? Math.max(
            ...scores.value
              .filter((s) => s.Status === "approved")
              .map((s) => s.TotalScore || 0)
          )
        : 0,
  };
});

onMounted(() => {
  loadScores();
  loadRounds();
});

async function loadScores() {
  loading.value = true;
  error.value = "";

  try {
    const params = {
      archerId: authStore.user.id,
    };
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

async function deleteScore(score) {
  if (
    !confirm(
      `Are you sure you want to delete this score?\n\nRound: ${score.round.Name}\nScore: ${score.TotalScore}\n\nThis cannot be undone.`
    )
  ) {
    return;
  }

  try {
    await api.delete(`/scores/${score.ScoreRecordID}`);
    await loadScores();
  } catch (err) {
    alert(err.response?.data?.error || "Failed to delete score");
  }
}

function closeViewModal() {
  showViewModal.value = false;
  selectedScore.value = null;
  scoreDetails.value = [];
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
  margin-bottom: 24px;
}

.stat-card {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #444;
}

.stat-card h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  text-transform: uppercase;
}

.stat-number {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
}

.container-filter {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.container-filter select {
  padding: 10px 16px;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
}

.container-filter select:hover {
  border-color: var(--primary-color);
}

.container-table {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #444;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #1e1e1e;
}

th {
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid #444;
  font-weight: 600;
  color: #ffffff;
  font-size: 14px;
  text-transform: uppercase;
  background: #252525;
}

td {
  padding: 16px 12px;
  border-bottom: 1px solid #333;
  color: #ffffff;
  background: #1e1e1e;
}

tbody tr {
  background: #1e1e1e;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-staged {
  background: #6c757d;
  color: white;
}

.badge-pending {
  background: #ffc107;
  color: #000;
}

.badge-approved {
  background: #28a745;
  color: white;
}

.badge-rejected {
  background: #dc3545;
  color: white;
}

.btn-small {
  padding: 6px 12px;
  font-size: 13px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 8px;
  font-weight: 500;
}

.btn-small:hover {
  opacity: 0.9;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.loading,
.error-message {
  text-align: center;
  padding: 40px;
  color: #ffffff;
}

.error-message {
  color: #dc3545;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 16px;
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
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  color: #ffffff;
}

.modal-content.large {
  max-width: 900px;
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

.score-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #2d2d2d;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.detail-item span {
  font-size: 16px;
  color: #ffffff;
  font-weight: 500;
}

.score-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
  padding: 20px;
  background: #2d2d2d;
  border-radius: 8px;
}

.summary-item {
  text-align: center;
}

.summary-item label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  text-transform: uppercase;
  font-weight: 600;
}

.summary-item span {
  font-size: 20px;
  color: #ffffff;
  font-weight: 600;
}

.score-value {
  font-size: 36px !important;
  color: var(--primary-color) !important;
}

.approval-info,
.rejection-info {
  margin-bottom: 24px;
  padding: 16px;
  background: #2d2d2d;
  border-radius: 8px;
}

.rejection-info {
  border-left: 4px solid #dc3545;
}

.approval-info {
  border-left: 4px solid #28a745;
}

.ends-table {
  margin-bottom: 24px;
}

.ends-table h3 {
  margin-bottom: 16px;
  color: #ffffff;
}

.ends-table table {
  background: #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
}

.notes-section {
  padding: 16px;
  background: #2d2d2d;
  border-radius: 8px;
}

.notes-section h3 {
  margin-bottom: 12px;
  color: #ffffff;
}

.notes-section p {
  color: #cccccc;
  line-height: 1.6;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #444;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}
</style>
