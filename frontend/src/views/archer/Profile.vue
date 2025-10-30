<template>
  <div class="profile">
    <div class="header-section">
      <h1>My Profile</h1>
      <button @click="showEditModal = true" class="btn-primary">
        <i class="icon">✏️</i> Edit Profile
      </button>
    </div>

    <!-- Profile Display -->
    <div class="profile-card" v-if="archer">
      <div class="profile-header">
        <div class="avatar">
          {{ archer.FirstName[0] }}{{ archer.LastName[0] }}
        </div>
        <div class="profile-info">
          <h2>{{ archer.FirstName }} {{ archer.LastName }}</h2>
          <p class="email">{{ archer.Email }}</p>
          <div class="badges">
            <span class="badge badge-class">{{ archer.class?.ClassName }}</span>
            <span class="badge badge-division">{{
              archer.defaultDivision?.Name
            }}</span>
          </div>
        </div>
      </div>

      <div class="profile-details">
        <div class="detail-row">
          <label>Date of Birth</label>
          <span>{{ formatDate(archer.DateOfBirth) }}</span>
        </div>
        <div class="detail-row">
          <label>Gender</label>
          <span>{{ archer.Gender }}</span>
        </div>
        <div class="detail-row">
          <label>Class</label>
          <span>{{ archer.class?.ClassName }}</span>
        </div>
        <div class="detail-row">
          <label>Division (Equipment)</label>
          <span>{{ archer.defaultDivision?.Name }}</span>
        </div>
        <div class="detail-row">
          <label>Category</label>
          <span
            >{{ archer.class?.ClassName }} -
            {{ archer.defaultDivision?.Name }}</span
          >
        </div>
        <div class="detail-row">
          <label>Member Since</label>
          <span>{{ formatDate(archer.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Profile</h2>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>

        <form @submit.prevent="submitEdit" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>First Name</label>
              <input
                v-model="editForm.FirstName"
                type="text"
                required
                placeholder="Enter first name"
              />
            </div>

            <div class="form-group">
              <label>Last Name</label>
              <input
                v-model="editForm.LastName"
                type="text"
                required
                placeholder="Enter last name"
              />
            </div>

            <div class="form-group">
              <label>Email</label>
              <input
                v-model="editForm.Email"
                type="email"
                required
                placeholder="Enter email"
              />
            </div>

            <div class="form-group">
              <label>Date of Birth</label>
              <input v-model="editForm.DateOfBirth" type="date" required />
            </div>

            <div class="form-group">
              <label>Gender</label>
              <select v-model="editForm.Gender" required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div class="form-group">
              <label>Division (Equipment)</label>
              <select v-model="editForm.DivisionID" required>
                <option
                  v-for="division in divisions"
                  :key="division.DivisionID"
                  :value="division.DivisionID"
                >
                  {{ division.Name }}
                </option>
              </select>
            </div>

            <div class="form-group full-width">
              <label>Change Password (leave blank to keep current)</label>
              <input
                v-model="editForm.Password"
                type="password"
                placeholder="Enter new password (optional)"
                autocomplete="new-password"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="closeEditModal" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? "Saving..." : "Save Changes" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !archer" class="loading">Loading profile...</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const archer = ref(null);
const divisions = ref([]);
const showEditModal = ref(false);
const loading = ref(false);

const editForm = ref({
  FirstName: "",
  LastName: "",
  Email: "",
  DateOfBirth: "",
  Gender: "",
  DivisionID: "",
  Password: "",
});

onMounted(async () => {
  await loadProfile();
  await loadDivisions();
});

async function loadProfile() {
  try {
    loading.value = true;
    const response = await api.get(`/archers/${user.value.archerId}`);
    archer.value = response.data.archer;
  } catch (error) {
    console.error("Failed to load profile:", error);
    alert("Failed to load profile");
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

function openEditModal() {
  if (!archer.value) return;

  editForm.value = {
    FirstName: archer.value.FirstName,
    LastName: archer.value.LastName,
    Email: archer.value.Email,
    DateOfBirth: archer.value.DateOfBirth?.split("T")[0] || "",
    Gender: archer.value.Gender,
    DivisionID: archer.value.DefaultDivisionID,
    Password: "",
  };
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  editForm.value = {
    FirstName: "",
    LastName: "",
    Email: "",
    DateOfBirth: "",
    Gender: "",
    DivisionID: "",
    Password: "",
  };
}

async function submitEdit() {
  try {
    loading.value = true;

    const payload = {
      FirstName: editForm.value.FirstName,
      LastName: editForm.value.LastName,
      Email: editForm.value.Email,
      DateOfBirth: editForm.value.DateOfBirth,
      Gender: editForm.value.Gender,
      DivisionID: editForm.value.DivisionID,
    };

    // Only include password if it's not empty
    if (editForm.value.Password && editForm.value.Password.trim() !== "") {
      payload.Password = editForm.value.Password;
    }

    const response = await api.put(`/archers/${user.value.archerId}`, payload);

    alert("Profile updated successfully!");
    
    // Update local archer data
    archer.value = response.data.archer;
    
    // Update auth store if user info changed
    if (response.data.archer) {
      authStore.user.firstName = response.data.archer.FirstName;
      authStore.user.lastName = response.data.archer.LastName;
      authStore.user.email = response.data.archer.Email;
    }
    
    closeEditModal();
  } catch (error) {
    console.error("Failed to update profile:", error);
    alert(
      error.response?.data?.error ||
        "Failed to update profile. Please try again."
    );
  } finally {
    loading.value = false;
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
</script>

<style scoped>
.profile {
  padding: 2rem;
  max-width: 900px;
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
  color: #111111;
  font-size: 2.75rem;
  font-weight: 800;
}

.profile-card {
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 8px;
  overflow: hidden;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #2d5016 0%, #1e1e1e 100%);
  border-bottom: 1px solid #444;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #4caf50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  flex-shrink: 0;
}

.profile-info h2 {
  margin: 0 0 0.5rem 0;
  color: #ffffff;
  font-size: 1.8rem;
}

.email {
  color: #aaaaaa;
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
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

.profile-details {
  padding: 2rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #333;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  font-weight: 500;
  color: #ffffff;
  font-size: 1rem;
}

.detail-row span {
  color: #aaaaaa;
  text-align: right;
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
  max-width: 600px;
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #ffffff;
  font-size: 0.95rem;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #444;
  border-radius: 4px;
  color: #000000;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4caf50;
}

.form-group input::placeholder {
  color: #999;
}

.info-box {
  background: #2d3748;
  border: 1px solid #4299e1;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-box .icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.info-box p {
  margin: 0;
  color: #aaaaaa;
  font-size: 0.9rem;
  line-height: 1.5;
}

.info-box strong {
  color: #4299e1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #444;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  background: #666;
  cursor: not-allowed;
}

.btn-secondary {
  background: #444;
  color: #ffffff;
}

.btn-secondary:hover {
  background: #555;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #aaaaaa;
  font-size: 1.1rem;
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .profile {
    padding: 1rem;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-height: 95vh;
  }
}
</style>
