const prisma = require("./prisma");

/**
 * Determine customer credit tier based on score (300 - 850)
 */
function getCreditTier(score) {
  if (score >= 740) return "Platinum";
  if (score >= 670) return "Gold";
  if (score >= 580) return "Silver";
  return "Bronze";
}

/**
 * Adjust user's credit score and tier, clamped between 300 and 850
 */
async function adjustUserCreditScore(userId, deltaPoints, reason = "") {
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, creditScore: true, creditTier: true }
    });

    if (!user) return null;

    const currentScore = user.creditScore || 650;
    const newScore = Math.max(300, Math.min(850, currentScore + deltaPoints));
    const newTier = getCreditTier(newScore);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        creditScore: newScore,
        creditTier: newTier
      }
    });

    console.log(`[CreditScore] User ${userId} adjusted by ${deltaPoints} (${reason}): ${currentScore} -> ${newScore} (${newTier})`);
    return updated;
  } catch (err) {
    console.error("[CreditScore] Failed to adjust credit score:", err.message);
    return null;
  }
}

module.exports = {
  getCreditTier,
  adjustUserCreditScore
};
