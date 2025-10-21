<template>
  <main>
    <div class="profile-requests">
      <div class="header-section">
        <h1>Profile Update Requests</h1>
        <div class="stats">
          <span class="stat-badge">{{ requests.length }} Pending</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && requests.length === 0" class="empty-state">
        <div class="empty-icon">✓</div>
        <h3>No Pending Requests</h3>
        <p>All profile update requests have been processed.</p>
      </div>

      <!-- Requests List -->
      <div v-else class="requests-list">
        <div
          v-for="request in requests"
          :key="request.RequestID"
          class="request-card"
        >
          <div class="request-header">
            <div class="archer-info">
              <h3>
                {{ request.Archer.FirstName }} {{ request.Archer.LastName }}
              </h3>
              <p class="email">{{ request.Archer.Email }}</p>
              <div class="badges">
                <span class="badge badge-class">{{
                  request.Archer.class?.ClassName
                }}</span>
                <span class="badge badge-division">{{
                  request.Archer.defaultDivision?.Name
                }}</span>
              </div>
            </div>
            <div class="request-date">
              <small>Submitted</small>
              <span>{{ formatDate(request.CreatedAt) }}</span>
            </div>
          </div>

          <div class="changes-section">
            <h4>Requested Changes:</h4>
            <div class="changes-grid">
              <div v-if="request.FirstName" class="change-item">
                <label>First Name</label>
                <div class="change-values">
                  <span class="old-value">{{ request.Archer.FirstName }}</span>
                  <span class="arrow">→</span>
                  <span class="new-value">{{ request.FirstName }}</span>
                </div>
              </div>

              <div v-if="request.LastName" class="change-item">
                <label>Last Name</label>
                <div class="change-values">
                  <span class="old-value">{{ request.Archer.LastName }}</span>
                  <span class="arrow">→</span>
                  <span class="new-value">{{ request.LastName }}</span>
                </div>
              </div>

              <div v-if="request.Email" class="change-item">
                <label>Email</label>
                <div class="change-values">
                  <span class="old-value">{{ request.Archer.Email }}</span>
                  <span class="arrow">→</span>
                  <span class="new-value">{{ request.Email }}</span>
                </div>
              </div>

              <div v-if="request.DateOfBirth" class="change-item">
                <label>Date of Birth</label>
                <div class="change-values">
                  <span class="old-value">{{
                    formatDate(request.Archer.DateOfBirth)
                  }}</span>
                  <span class="arrow">→</span>
                  <span class="new-value">{{
                    formatDate(request.DateOfBirth)
                  }}</span>
                </div>
              </div>

              <div v-if="request.Gender" class="change-item">
                <label>Gender</label>
                <div class="change-values">
                  <span class="old-value">{{ request.Archer.Gender }}</span>
                  <span class="arrow">→</span>
                  <span class="new-value">{{ request.Gender }}</span>
                </div>
              </div>

              <div v-if="request.DivisionID" class="change-item">
                <label>Division</label>
                <div class="change-values">
                  <span class="old-value">{{
                    request.Archer.defaultDivision?.Name
                  }}</span>
                  <span class="arrow">→</span>
                  <span class="new-value">{{
                    getDivisionName(request.DivisionID)
                  }}</span>
                </div>
              </div>

              <div v-if="request.PasswordHash" class="change-item">
                <label>Password</label>
                <div class="change-values">
                  <span class="new-value">🔒 Password will be changed</span>
                </div>
              </div>
            </div>
          </div>

          <div class="request-actions">
            <button
              @click="openRejectModal(request)"
              class="btn-reject"
              :disabled="processing"
            >
              Reject
            </button>
            <button
              @click="approveRequest(request.RequestID)"
              class="btn-approve"
              :disabled="processing"
            >
              Approve Changes
            </button>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div
        v-if="showRejectModal"
        class="modal-overlay"
        @click="closeRejectModal"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Reject Profile Update</h2>
            <button class="close-btn" @click="closeRejectModal">×</button>
          </div>

          <form @submit.prevent="submitReject" class="modal-body">
            <p style="color: #aaaaaa; margin-bottom: 1rem">
              Rejecting update request from:
              <strong style="color: #ffffff"
                >{{ selectedRequest?.Archer.FirstName }}
                {{ selectedRequest?.Archer.LastName }}</strong
              >
            </p>

            <div class="form-group">
              <label>Rejection Reason</label>
              <textarea
                v-model="rejectReason"
                required
                rows="4"
                placeholder="Explain why this update request is being rejected..."
              ></textarea>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                @click="closeRejectModal"
                class="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" class="btn-reject" :disabled="processing">
                {{ processing ? "Rejecting..." : "Confirm Rejection" }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">Loading requests...</div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/api";

const requests = ref([]);
const divisions = ref([]);
const loading = ref(false);
const processing = ref(false);
const showRejectModal = ref(false);
const selectedRequest = ref(null);
const rejectReason = ref("");

onMounted(async () => {
  await loadRequests();
  await loadDivisions();
});

async function loadRequests() {
  try {
    loading.value = true;
    const response = await api.get("/archers/requests/pending");
    requests.value = response.data.requests;
  } catch (error) {
    console.error("Failed to load requests:", error);
    alert("Failed to load profile update requests");
  } finally {
    loading.value = false;
  }
}

async function loadDivisions() {
  try {
    const response = await api.get("/divisions");
    divisions.value = response.data.divisions;
  } catch (error) {
    console.error("Failed to load divisions:", error);
  }
}

async function approveRequest(requestId) {
  if (
    !confirm(
      "Are you sure you want to approve this profile update? The changes will be applied immediately."
    )
  ) {
    return;
  }

  try {
    processing.value = true;
    await api.post(`/archers/requests/${requestId}/approve`);
    alert("Profile update approved successfully!");
    await loadRequests();
  } catch (error) {
    console.error("Failed to approve request:", error);
    alert(
      error.response?.data?.message ||
        "Failed to approve request. Please try again."
    );
  } finally {
    processing.value = false;
  }
}

function openRejectModal(request) {
  selectedRequest.value = request;
  rejectReason.value = "";
  showRejectModal.value = true;
}

function closeRejectModal() {
  showRejectModal.value = false;
  selectedRequest.value = null;
  rejectReason.value = "";
}

async function submitReject() {
  try {
    processing.value = true;
    await api.post(
      `/archers/requests/${selectedRequest.value.RequestID}/reject`,
      {
        reason: rejectReason.value,
      }
    );
    alert("Profile update rejected");
    closeRejectModal();
    await loadRequests();
  } catch (error) {
    console.error("Failed to reject request:", error);
    alert(
      error.response?.data?.message ||
        "Failed to reject request. Please try again."
    );
  } finally {
    processing.value = false;
  }
}

function getDivisionName(divisionId) {
  const division = divisions.value.find((d) => d.DivisionID === divisionId);
  return division?.Name || "Unknown";
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
</script>

<style scoped>
.profile-requests {
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-section h1 {
  margin: 0;
  color: #000000;
}

.stats {
  display: flex;
  gap: 1rem;
}

.stat-badge {
  background: #2d5016;
  color: #4caf50;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #4caf50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 50%;
}

.empty-state h3 {
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.empty-state p {
  color: #aaaaaa;
  margin: 0;
  font-size: 1rem;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.request-card {
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid #444;
  margin-bottom: 1rem;
}

.archer-info h3 {
  margin: 0 0 0.5rem 0;
  color: #ffffff;
  font-size: 1.3rem;
}

.email {
  color: #aaaaaa;
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
}

.badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.3rem 0.7rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge-class {
  background: #4caf50;
  color: white;
}

.badge-division {
  background: #2196f3;
  color: white;
}

.request-date {
  text-align: right;
}

.request-date small {
  display: block;
  color: #666;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.request-date span {
  color: #aaaaaa;
  font-size: 0.9rem;
}

.changes-section {
  margin-bottom: 1.5rem;
}

.changes-section h4 {
  color: #ffffff;
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.changes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.change-item {
  background: #2d2d2d;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #444;
}

.change-item label {
  display: block;
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.change-values {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.old-value {
  color: #999;
  text-decoration: line-through;
}

.arrow {
  color: #4caf50;
  font-weight: bold;
}

.new-value {
  color: #4caf50;
  font-weight: 600;
}

.request-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #444;
}

.btn-approve,
.btn-reject,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-approve {
  background: #4caf50;
  color: white;
}

.btn-approve:hover:not(:disabled) {
  background: #45a049;
}

.btn-reject {
  background: #f44336;
  color: white;
}

.btn-reject:hover:not(:disabled) {
  background: #da190b;
}

.btn-secondary {
  background: #444;
  color: #ffffff;
}

.btn-secondary:hover {
  background: #555;
}

.btn-approve:disabled,
.btn-reject:disabled {
  background: #666;
  cursor: not-allowed;
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
  padding: 1rem;
}

.modal-content {
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #444;
}

.modal-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: #aaaaaa;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #333;
  color: #ffffff;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #ffffff;
  font-size: 0.95rem;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #444;
  border-radius: 4px;
  color: #000000;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: #4caf50;
}

.form-group textarea::placeholder {
  color: #999;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #444;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #aaaaaa;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .profile-requests {
    padding: 1rem;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .request-header {
    flex-direction: column;
    gap: 1rem;
  }

  .request-date {
    text-align: left;
  }

  .changes-grid {
    grid-template-columns: 1fr;
  }

  .request-actions {
    flex-direction: column;
  }

  .btn-approve,
  .btn-reject {
    width: 100%;
  }
}
</style>
