const express = require("express");
const router = express.Router();
const championshipController = require("../controllers/championshipController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// All authenticated users can view championships
router.get("/", auth, championshipController.getAllChampionships);
router.get("/:id", auth, championshipController.getChampionshipById);
router.get(
  "/:id/standings",
  auth,
  championshipController.getChampionshipStandings
);
router.get(
  "/:id/winners",
  auth,
  championshipController.getChampionshipWinners
);

// Admin only
router.post(
  "/",
  auth,
  roleCheck("admin"),
  championshipController.createChampionship
);
router.put(
  "/:id",
  auth,
  roleCheck("admin"),
  championshipController.updateChampionship
);
router.delete(
  "/:id",
  auth,
  roleCheck("admin"),
  championshipController.deleteChampionship
);
router.post(
  "/:id/competitions",
  auth,
  roleCheck("admin"),
  championshipController.addCompetitionToChampionship
);
router.delete(
  "/:id/competitions/:competitionId",
  auth,
  roleCheck("admin"),
  championshipController.removeCompetitionFromChampionship
);

module.exports = router;
