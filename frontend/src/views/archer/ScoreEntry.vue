<template>
  <main>
    <h1>Enter Score</h1>
    <p>Record your archery scores for a round</p>

    <div class="form-container">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="round">Round *</label>
          <select
            id="round"
            v-model="formData.roundId"
            required
            @change="loadRoundDetails"
          >
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
          <label for="competition">Competition (Optional)</label>
          <select id="competition" v-model="formData.competitionId">
            <option value="">Practice Score (No Competition)</option>
            <option
              v-for="comp in competitions"
              :key="comp.CompetitionID"
              :value="comp.CompetitionID"
            >
              {{ comp.Name }} - {{ formatDate(comp.Date) }}
            </option>
          </select>
          <small style="color: var(--muted-text); display: block; margin-top: 4px">
            Leave blank if this is a practice score
          </small>
        </div>

        <div class="form-group">
          <label for="division">Division *</label>
          <select id="division" v-model="formData.divisionId" required>
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
          <label for="dateShot">Date</label>
          <input
            id="dateShot"
            v-model="formData.dateShot"
            type="date"
            required
          />
        </div>

        <div class="form-group">
          <label for="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            v-model="formData.notes"
            placeholder="Add any notes about this score..."
          ></textarea>
        </div>

        <div v-if="roundDetails" style="margin-top: 24px">
          <h3>Enter Arrow Scores</h3>
          <p style="color: var(--muted-text); margin-bottom: 16px">
            Enter scores for each arrow (0-10, where 0 = Miss)
          </p>

          <div
            v-for="(end, endIndex) in formData.ends"
            :key="endIndex"
            style="
              margin-bottom: 20px;
              padding: 16px;
              background: var(--muted);
              border-radius: 8px;
            "
          >
            <h4>End {{ endIndex + 1 }}</h4>
            <div
              style="
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 8px;
              "
            >
              <div v-for="(arrow, arrowIndex) in end.arrows" :key="arrowIndex">
                <input
                  v-model.number="arrow.score"
                  type="number"
                  min="0"
                  max="10"
                  required
                  style="width: 100%; padding: 8px; text-align: center"
                  :placeholder="`A${arrowIndex + 1}`"
                />
              </div>
            </div>
            <p style="margin: 8px 0 0; font-weight: 600">
              End Total: {{ calculateEndTotal(end) }}
            </p>
          </div>

          <div
            style="
              padding: 16px;
              background: var(--panel);
              border-radius: 8px;
              margin-bottom: 20px;
            "
          >
            <h3 style="margin: 0">Total Score: {{ calculateTotalScore() }}</h3>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading || !roundDetails"
          >
            {{ loading ? "Saving..." : "Save Score" }}
          </button>
          <router-link to="/archer" class="btn btn-secondary"
            >Cancel</router-link
          >
        </div>
      </form>

      <div v-if="error" class="error-message" style="margin-top: 16px">
        {{ error }}
      </div>
      <div v-if="success" class="success-message" style="margin-top: 16px">
        Score saved successfully! It will be reviewed by a recorder.
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMetadataStore } from "@/stores/metadata";
import { useScoreStore } from "@/stores/scores";

const router = useRouter();
const metadataStore = useMetadataStore();
const scoreStore = useScoreStore();

const rounds = ref([]);
const divisions = ref([]);
const competitions = ref([]);
const roundDetails = ref(null);
const loading = ref(false);
const error = ref("");
const success = ref(false);

const formData = ref({
  roundId: "",
  divisionId: "",
  competitionId: "",
  dateShot: new Date().toISOString().split("T")[0],
  notes: "",
  ends: [],
});

onMounted(async () => {
  try {
    rounds.value = await metadataStore.fetchRounds();
    divisions.value = await metadataStore.fetchDivisions();
    await loadCompetitions();
  } catch (err) {
    error.value = "Failed to load form data";
  }
});

async function loadCompetitions() {
  try {
    const response = await scoreStore.api.get("/competitions", {
      params: { limit: 100 }
    });
    // Filter for upcoming and ongoing competitions only
    competitions.value = response.data.competitions.filter(c => 
      c.Status === 'upcoming' || c.Status === 'ongoing' || c.Status === 'active'
    );
  } catch (err) {
    console.error("Failed to load competitions:", err);
  }
}

async function loadRoundDetails() {
  if (!formData.value.roundId) return;

  try {
    roundDetails.value = await metadataStore.fetchRoundById(
      formData.value.roundId
    );

    // Initialize ends based on round
    const totalEnds = roundDetails.value.ranges.reduce(
      (sum, range) => sum + range.Ends,
      0
    );
    formData.value.ends = Array.from({ length: totalEnds }, (_, i) => ({
      endNumber: i + 1,
      arrows: Array.from({ length: 6 }, (_, j) => ({
        score: 0,
        arrowOrder: j + 1,
      })),
    }));
  } catch (err) {
    error.value = "Failed to load round details";
  }
}

function calculateEndTotal(end) {
  return end.arrows.reduce((sum, arrow) => sum + (arrow.score || 0), 0);
}

function calculateTotalScore() {
  return formData.value.ends.reduce(
    (total, end) => total + calculateEndTotal(end),
    0
  );
}

async function handleSubmit() {
  loading.value = true;
  error.value = "";
  success.value = false;

  try {
    await scoreStore.createScore(formData.value);
    success.value = true;
    
    const scoreType = formData.value.competitionId ? "competition" : "practice";
    const message = formData.value.competitionId 
      ? "Competition score saved successfully! It will be reviewed by a recorder."
      : "Practice score saved successfully!";
    
    alert(message);
    
    setTimeout(() => {
      router.push("/archer/scores");
    }, 1500);
  } catch (err) {
    error.value = err.message || "Failed to save score";
  } finally {
    loading.value = false;
  }
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
</script>
