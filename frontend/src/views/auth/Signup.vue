<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Sign Up</h1>
      <p>Create your archery account</p>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form @submit.prevent="handleSignup">
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input
            id="firstName"
            v-model="formData.firstName"
            type="text"
            required
            placeholder="John"
          />
        </div>

        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input
            id="lastName"
            v-model="formData.lastName"
            type="text"
            required
            placeholder="Doe"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            placeholder="your@email.com"
          />
        </div>

        <div class="form-group">
          <label for="dateOfBirth">Date of Birth</label>
          <input
            id="dateOfBirth"
            v-model="formData.dateOfBirth"
            type="date"
            required
          />
        </div>

        <div class="form-group">
          <label for="gender">Gender</label>
          <select id="gender" v-model="formData.gender" required>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div class="form-group">
          <label for="defaultDivisionId">Default Division (Optional)</label>
          <select id="defaultDivisionId" v-model="formData.defaultDivisionId">
            <option value="">Select division</option>
            <option
              v-for="division in divisions"
              :key="division.DivisionID"
              :value="division.DivisionID"
            >
              {{ division.Name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            required
            minlength="8"
            placeholder="••••••••"
          />
          <small style="color: var(--muted-text)">Minimum 8 characters</small>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? "Creating account..." : "Sign Up" }}
          </button>
        </div>
      </form>

      <div class="auth-link">
        Already have an account? <router-link to="/login">Login</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useMetadataStore } from "@/stores/metadata";

const router = useRouter();
const authStore = useAuthStore();
const metadataStore = useMetadataStore();

const formData = ref({
  firstName: "",
  lastName: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  password: "",
  defaultDivisionId: "",
});

const divisions = ref([]);
const loading = ref(false);
const error = ref("");

onMounted(async () => {
  try {
    divisions.value = await metadataStore.fetchDivisions();
  } catch (err) {
    console.error("Failed to load divisions:", err);
  }
});

async function handleSignup() {
  loading.value = true;
  error.value = "";

  try {
    await authStore.signup(formData.value);
    // Small delay to ensure store is updated
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Use replace instead of push to prevent going back to signup
    router.replace("/archer");
  } catch (err) {
    error.value = err.message || "Signup failed. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>
