import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

// Usage: const { companyId, company, loading } = useCompany();

export default function useCompany() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      setLoading(true);
      if (!user) {
        setCompanyId(null);
        setCompany(null);
        setLoading(false);
        return;
      }
      // 1. Get user's profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const cId = userDoc.data()?.companyId;
      setCompanyId(cId || null);

      // 2. Get company data
      if (cId) {
        const companyDoc = await getDoc(doc(db, "companies", cId));
        setCompany({ id: cId, ...companyDoc.data() });
      } else {
        setCompany(null);
      }
      setLoading(false);
    }
    fetchCompany();
  }, [user]);

  return { companyId, company, loading };
}
