/**
 * Calculate age from date of birth
 * @param {Date|string} dateOfBirth
 * @param {Date|string} referenceDate - Date to calculate age at (default: today)
 * @returns {number} Age in years
 */
function calculateAge(dateOfBirth, referenceDate = new Date()) {
  const dob = new Date(dateOfBirth);
  const ref = new Date(referenceDate);

  let age = ref.getFullYear() - dob.getFullYear();
  const monthDiff = ref.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Determine appropriate class based on age and gender
 * @param {number} age
 * @param {string} gender - 'Male' or 'Female'
 * @returns {string} Class name
 */
function determineClass(age, gender) {
  if (age < 14) {
    return `Under 14 ${gender}`;
  } else if (age < 16) {
    return `Under 16 ${gender}`;
  } else if (age < 18) {
    return `Under 18 ${gender}`;
  } else if (age < 21) {
    return `Under 21 ${gender}`;
  } else if (age < 50) {
    return `${gender} Open`;
  } else if (age < 60) {
    return `50+ ${gender}`;
  } else if (age < 70) {
    return `60+ ${gender}`;
  } else {
    return `70+ ${gender}`;
  }
}

/**
 * Calculate total score from ends
 * @param {Array} ends - Array of end objects with arrows
 * @returns {number} Total score
 */
function calculateTotalScore(ends) {
  return ends.reduce((total, end) => {
    const endScore = end.arrows.reduce((sum, arrow) => sum + arrow.Score, 0);
    return total + endScore;
  }, 0);
}

/**
 * Validate score record structure
 * @param {Object} scoreData - Score record with ends and arrows
 * @param {Object} round - Round object with ranges
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateScoreStructure(scoreData, round) {
  const errors = [];

  // Calculate expected number of ends
  const totalEnds = round.ranges.reduce((sum, range) => sum + range.Ends, 0);

  if (scoreData.ends.length !== totalEnds) {
    errors.push(`Expected ${totalEnds} ends but got ${scoreData.ends.length}`);
  }

  // Validate each end has 6 arrows
  scoreData.ends.forEach((end, index) => {
    if (!end.arrows || end.arrows.length !== 6) {
      errors.push(`End ${index + 1} must have exactly 6 arrows`);
    }

    // Validate arrow scores
    if (end.arrows) {
      end.arrows.forEach((arrow, arrowIndex) => {
        if (arrow.Score < 0 || arrow.Score > 10) {
          errors.push(
            `End ${index + 1}, Arrow ${arrowIndex + 1}: Invalid score ${
              arrow.Score
            }`
          );
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a date falls within a date range
 * @param {Date|string} date
 * @param {Date|string} startDate
 * @param {Date|string} endDate - null means no end date
 * @returns {boolean}
 */
function isDateInRange(date, startDate, endDate) {
  const d = new Date(date);
  const start = new Date(startDate);

  if (d < start) return false;
  if (endDate === null) return true;

  const end = new Date(endDate);
  return d <= end;
}

/**
 * Format archer name
 * @param {Object} archer
 * @returns {string}
 */
function formatArcherName(archer) {
  return `${archer.FirstName} ${archer.LastName}`;
}

module.exports = {
  calculateAge,
  determineClass,
  calculateTotalScore,
  validateScoreStructure,
  isDateInRange,
  formatArcherName,
};
