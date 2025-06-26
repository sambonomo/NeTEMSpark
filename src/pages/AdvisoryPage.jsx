import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import SavingsIcon from "@mui/icons-material/Savings";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import useCompany from "../context/useCompany";

export default function AdvisoryPage() {
  const { companyId, loading: companyLoading } = useCompany();
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const q = query(
      collection(db, "advisoryEvents"),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAdvisories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [companyId]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Advisory & Savings <SavingsIcon sx={{ fontSize: 30, ml: 1, mb: "-6px", color: "primary.main" }} />
      </Typography>

      <Typography variant="h6" fontWeight={600} mb={2}>
        Savings Opportunities
      </Typography>

      {companyLoading || loading ? (
        <CircularProgress />
      ) : advisories.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No savings opportunities found for your company.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Current Cost</TableCell>
                <TableCell>Recommendation</TableCell>
                <TableCell>Potential Savings</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {advisories.map((adv) => (
                <TableRow key={adv.id}>
                  <TableCell>{adv.vendor || "—"}</TableCell>
                  <TableCell>{adv.currentCost || "—"}</TableCell>
                  <TableCell>{adv.recommendation || "—"}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        color: "success.dark",
                        fontWeight: 700,
                      }}
                    >
                      {adv.potentialSavings ? `$${adv.potentialSavings}/mo` : "—"}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => alert("TODO: Implement Request Quote flow!")}
                    >
                      Request Quote
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
