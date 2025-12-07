/**
 * Simple in-memory store for resume data and credits.
 * NOTE: This is for demo/MVP only. Data is lost on server restart.
 */

const resumeSessions = new Map(); // clientSessionId -> { resumeText, notes, jobDescription }
const paymentCredits = new Map(); // checkoutSessionId -> remainingCredits

function saveResumeData(clientSessionId, data) {
  resumeSessions.set(clientSessionId, {
    resumeText: data.resumeText,
    notes: data.notes || '',
    jobDescription: data.jobDescription
  });
}

function getResumeData(clientSessionId) {
  return resumeSessions.get(clientSessionId) || null;
}

function initCreditsForPayment(checkoutSessionId, initialCredits = 3) {
  if (!paymentCredits.has(checkoutSessionId)) {
    paymentCredits.set(checkoutSessionId, initialCredits);
  }
}

function consumeCredit(checkoutSessionId) {
  if (!paymentCredits.has(checkoutSessionId)) {
    return { success: false, remainingCredits: 0 };
  }
  const current = paymentCredits.get(checkoutSessionId);
  if (current > 0) {
    const remaining = current - 1;
    paymentCredits.set(checkoutSessionId, remaining);
    return { success: true, remainingCredits: remaining };
  }
  return { success: false, remainingCredits: 0 };
}

function getRemainingCredits(checkoutSessionId) {
  if (!paymentCredits.has(checkoutSessionId)) return null;
  return paymentCredits.get(checkoutSessionId);
}

module.exports = {
  saveResumeData,
  getResumeData,
  initCreditsForPayment,
  consumeCredit,
  getRemainingCredits
};