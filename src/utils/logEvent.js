import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Log a user or system event for auditing.
 * @param {string} eventType - Short string, e.g. "contract.add", "inventory.bulkImport"
 * @param {object} details - Any additional event details to log (object)
 * @param {object} [options] - Optional override for user/company context
 */
export async function logEvent(eventType, details = {}, options = {}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const companyId = options.companyId || details.companyId || null;
    await addDoc(collection(db, "auditLogs"), {
      timestamp: serverTimestamp(),
      userId: user ? user.uid : null,
      userEmail: user ? user.email : null,
      companyId: companyId,
      eventType,
      details,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line
      console.warn("Audit log failed:", err);
    }
  }
}
