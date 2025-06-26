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
  LinearProgress,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useState, useEffect } from "react";
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
import Tesseract from "tesseract.js";
import { logEvent } from "../utils/logEvent";

function extractContractFields(text) {
  // Simple regex patterns, refine as needed
  const vendorMatch = text.match(/Vendor:\s*([A-Za-z0-9 .,-]+)/i);
  const serviceMatch = text.match(/Service:\s*([A-Za-z0-9 .,-]+)/i);
  const startMatch = text.match(/Start\s*Date:\s*([0-9/-]+)/i);
  const endMatch = text.match(/End\s*Date:\s*([0-9/-]+)/i);
  const monthlyMatch = text.match(/\$([0-9,.]+)[^\S\r\n]*per\s*month/i);

  return {
    vendor: vendorMatch ? vendorMatch[1].trim() : "",
    service: serviceMatch ? serviceMatch[1].trim() : "",
    startDate: startMatch ? startMatch[1].trim() : "",
    endDate: endMatch ? endMatch[1].trim() : "",
    monthlyCost: monthlyMatch ? monthlyMatch[1].replace(/,/g, "") : "",
    ocrRaw: text,
  };
}

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

  // OCR state
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrExtracted, setOcrExtracted] = useState(null);

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

  // OCR on file select
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile || null);
    setOcrExtracted(null);
    setOcrStatus("");
    setOcrProgress(0);

    if (!selectedFile) return;

    // Only process images for now (Tesseract works best for PNG/JPG/BMP, not PDF)
    if (!selectedFile.type.startsWith("image/")) {
      setOcrStatus("OCR only works for images (PNG/JPG) in this demo.");
      return;
    }

    setOcrStatus("Running OCR...");
    try {
      const reader = new window.FileReader();
      reader.onload = async (event) => {
        const imageData = event.target.result;
        const result = await Tesseract.recognize(imageData, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text" && m.progress) {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
        });
        const text = result.data.text;
        setOcrStatus("Extracting fields...");
        const extracted = extractContractFields(text);
        setOcrExtracted(extracted);
        setVendor(extracted.vendor);
        setService(extracted.service);
        setStartDate(extracted.startDate);
        setEndDate(extracted.endDate);
        setMonthlyCost(extracted.monthlyCost);
        setOcrStatus("OCR complete. Please review and edit below.");
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setOcrStatus("OCR failed. Please enter info manually.");
    }
  };

  // Submit new contract (with audit logging)
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
      const docRef = await addDoc(collection(db, "contracts"), {
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
        ocrRaw: ocrExtracted ? ocrExtracted.ocrRaw : "",
        ocrStatus: ocrExtracted ? "success" : "manual",
      });

      // Log audit event (async, never blocks main flow)
      logEvent(
        "contract.add",
        {
          contractId: docRef.id,
          vendor,
          service,
          startDate,
          endDate,
          monthlyCost,
          fileName: file.name,
          ocrStatus: ocrExtracted ? "success" : "manual",
        },
        { companyId }
      );

      // Reset state and close
      setOpen(false);
      setFile(null);
      setVendor("");
      setService("");
      setStartDate("");
      setEndDate("");
      setMonthlyCost("");
      setOcrStatus("");
      setOcrExtracted(null);
      setOcrProgress(0);
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
                PNG/JPG images supported for OCR (auto-extract).
                PDF support coming soon!
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
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
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
                  accept=".png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  required
                />
              </Button>
              {ocrStatus && (
                <Alert severity={ocrStatus.startsWith("OCR failed") ? "warning" : "info"}>
                  {ocrStatus}
                  {ocrProgress > 0 && ocrProgress < 100 && (
                    <Box mt={1}>
                      <LinearProgress variant="determinate" value={ocrProgress} />
                    </Box>
                  )}
                </Alert>
              )}
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
