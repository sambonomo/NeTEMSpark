import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import useCompany from "../context/useCompany";
import { logEvent } from "../utils/logEvent"; // ⬅️ Add this!

const macTypes = [
  { value: "Move", label: "Move" },
  { value: "Add", label: "Add" },
  { value: "Change", label: "Change" },
  { value: "Disconnect", label: "Disconnect" },
];

export default function MacRequestsPage() {
  const { user } = useAuth();
  const { companyId, loading: companyLoading } = useCompany();
  const [macs, setMacs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [type, setType] = useState("");
  const [service, setService] = useState("");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState("");

  // Live MAC requests (by company)
  useEffect(() => {
    if (!user || !companyId) return;
    setLoading(true);
    const q = query(
      collection(db, "macRequests"),
      where("companyId", "==", companyId),
      orderBy("submittedAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMacs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [user, companyId]);

  // Handle open/close
  const handleNewRequest = () => setOpen(true);

  // Submit new MAC
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (!companyId) throw new Error("No company selected.");
      const docRef = await addDoc(collection(db, "macRequests"), {
        companyId,
        userId: user.uid,
        type,
        service,
        details,
        requestedDate: date,
        status: "Submitted",
        submittedAt: serverTimestamp(),
      });

      // Audit log for MAC request submission
      logEvent("macRequest.add", {
        macRequestId: docRef.id,
        type,
        service,
        details,
        requestedDate: date,
        status: "Submitted",
      }, { companyId });

      setOpen(false);
      setType("");
      setService("");
      setDetails("");
      setDate("");
    } catch (err) {
      setError(err.message || "Failed to submit MAC request.");
    }
    setSubmitting(false);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        MAC Requests
      </Typography>

      {/* New MAC Request */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Submit a Move, Add, or Change
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Our team will process your request ASAP.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleNewRequest}
            sx={{ minWidth: 180, mt: { xs: 2, sm: 0 } }}
            disabled={companyLoading || !companyId}
          >
            New MAC Request
          </Button>
        </CardContent>
      </Card>

      {/* Submit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New MAC Request</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                select
                label="Request Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                {macTypes.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Service (e.g. DIA 100MB, phone line)"
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
              />
              <TextField
                label="Details / Notes"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                multiline
                minRows={2}
                required
              />
              <TextField
                label="Requested Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : "Submit"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MAC Requests Table */}
      <Typography variant="h6" fontWeight={600} mb={2}>
        Your MAC Requests
      </Typography>
      {companyLoading || loading ? (
        <CircularProgress />
      ) : macs.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No MAC requests submitted yet.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {macs.map((mac) => (
                <TableRow key={mac.id}>
                  <TableCell>{mac.type}</TableCell>
                  <TableCell>{mac.service}</TableCell>
                  <TableCell>{mac.details}</TableCell>
                  <TableCell>{mac.requestedDate}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        bgcolor:
                          mac.status === "Completed"
                            ? "success.light"
                            : mac.status === "In Progress"
                            ? "warning.light"
                            : "info.light",
                        color:
                          mac.status === "Completed"
                            ? "success.dark"
                            : mac.status === "In Progress"
                            ? "warning.dark"
                            : "info.dark",
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.5,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {mac.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {mac.submittedAt?.toDate
                      ? mac.submittedAt.toDate().toLocaleDateString()
                      : ""}
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
