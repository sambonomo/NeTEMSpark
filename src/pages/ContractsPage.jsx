import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useRef, useState, useEffect } from "react";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import useCompany from "../context/useCompany";

export default function ContractsPage() {
  const { user } = useAuth();
  const { companyId, loading: companyLoading } = useCompany();

  // State for contracts
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);

  // Contract form state
  const [vendor, setVendor] = useState("");
  const [service, setService] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("");

  // Live contracts by company
  useEffect(() => {
    if (!user || !companyId) return;
    setLoading(true);
    const q = query(
      collection(db, "contracts"),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setContracts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [user, companyId]);

  // Handle file input
  const handleUploadClick = () => setOpen(true);

  // Submit new contract
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploading(true);
    try {
      if (!file) throw new Error("No file selected.");
      if (!companyId) throw new Error("No company selected.");
      // Upload file to storage
      const fileRef = ref(storage, `contracts/${companyId}/${file.name}-${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      // Save contract record to Firestore
      await addDoc(collection(db, "contracts"), {
        companyId,
        userId: user.uid,
        vendor,
        service,
        startDate,
        endDate,
        monthlyCost,
        status: "Active",
        fileUrl: url,
        fileName: file.name,
        createdAt: serverTimestamp(),
      });

      // Reset state and close
      setOpen(false);
      setFile(null);
      setVendor("");
      setService("");
      setStartDate("");
      setEndDate("");
      setMonthlyCost("");
    } catch (err) {
      setError(err.message || "Failed to upload contract.");
    }
    setUploading(false);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Contracts
      </Typography>

      {/* Upload Contract */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight={600}>
                Upload New Contract
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                PDF, DOCX, or image files. OCR and auto-extract coming soon!
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                onClick={handleUploadClick}
                sx={{ mt: 1 }}
                disabled={companyLoading || !companyId}
              >
                Select & Upload
              </Button>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box
                sx={{
                  bgcolor: "grey.100",
                  borderRadius: 2,
                  p: 2,
                  minHeight: 80,
                  display: "flex",
                  alignItems: "center",
                  color: "text.secondary",
                  border: "1px dashed #bbb",
                  fontStyle: "italic",
                }}
              >
                {file
                  ? `Selected file: ${file.name}`
                  : "Vendor, service, dates and monthly cost required for upload."}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Upload New Contract</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
              >
                Choose File
                <input
                  type="file"
                  hidden
                  accept=".pdf,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  required
                />
              </Button>
              <TextField
                label="Vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                required
              />
              <TextField
                label="Service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
              />
              <TextField
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <TextField
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              <TextField
                label="Monthly Cost"
                value={monthlyCost}
                onChange={(e) => setMonthlyCost(e.target.value)}
                required
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={uploading}>
              {uploading ? <CircularProgress size={24} /> : "Upload"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Contracts Table */}
      <Typography variant="h6" fontWeight={600} mb={2}>
        Your Contracts
      </Typography>
      {companyLoading || loading ? (
        <CircularProgress />
      ) : contracts.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No contracts uploaded yet.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Monthly Cost</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Contract File</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.vendor}</TableCell>
                  <TableCell>{contract.service}</TableCell>
                  <TableCell>{contract.startDate}</TableCell>
                  <TableCell>{contract.endDate}</TableCell>
                  <TableCell>${contract.monthlyCost}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        bgcolor: "success.light",
                        color: "success.dark",
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.5,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {contract.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="text"
                      color="primary"
                      href={contract.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                    >
                      View File
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
