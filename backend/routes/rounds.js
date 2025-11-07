const express = require("express");
const router = express.Router();
const roundController = require("../controllers/roundController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// Public routes (authenticated users)
router.get("/", auth, roundController.getAllRounds);
router.get("/:id", auth, roundController.getRoundById);
router.get("/:id/equivalent", auth, roundController.getEquivalentRounds);
router.get("/eligible/:archerId", auth, roundController.getEligibleRounds);

// Admin/Recorder routes
router.post(
  "/",
  auth,
  roleCheck(["admin", "recorder"]),
  roundController.createRound
);
router.put(
  "/:id",
  auth,
  roleCheck(["admin", "recorder"]),
  roundController.updateRound
);

// Admin only
router.delete("/:id", auth, roleCheck("admin"), roundController.deleteRound);
router.post(
  "/equivalent",
  auth,
  roleCheck("admin"),
  roundController.createEquivalentRound
);
router.put(
  "/equivalent/:id",
  auth,
  roleCheck("admin"),
  roundController.updateEquivalentRound
);
router.delete(
  "/equivalent/:id",
  auth,
  roleCheck("admin"),
  roundController.deleteEquivalentRound
);

module.exports = router;
