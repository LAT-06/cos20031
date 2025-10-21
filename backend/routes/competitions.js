const express = require("express");
const router = express.Router();
const competitionController = require("../controllers/competitionController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// All authenticated users can view competitions
router.get("/", auth, competitionController.getAllCompetitions);
router.get("/:id", auth, competitionController.getCompetitionById);
router.get(
  "/:id/leaderboard",
  auth,
  competitionController.getCompetitionLeaderboard
);

// Admin/Recorder can create and update
router.post(
  "/",
  auth,
  roleCheck(["admin", "recorder"]),
  competitionController.createCompetition
);
router.put(
  "/:id",
  auth,
  roleCheck(["admin", "recorder"]),
  competitionController.updateCompetition
);

// Admin only
router.delete(
  "/:id",
  auth,
  roleCheck("admin"),
  competitionController.deleteCompetition
);

module.exports = router;
