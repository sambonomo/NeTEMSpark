import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  MenuItem,
  Alert,
  LinearProgress,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import CameraIcon from "@mui/icons-material/CameraAlt";
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
  writeBatch,
  doc
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import useCompany from "../context/useCompany";
import Papa from "papaparse";
import Tesseract from "tesseract.js";
import { logEvent } from "../utils/logEvent";

const types = [
  { value: "Circuit", label: "Circuit" },
  { value: "Phone", label: "Phone" },
  { value: "Mobile", label: "Mobile" },
  { value: "Hardware", label: "Hardware" },
  { value: "Other", label: "Other" },
];

function extractInventoryItemsFromText(text) {
  // Assume each line is: "Vendor, Item, Type, Monthly Charge"
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items = [];
  for (const line of lines) {
    const m = line.match(/^(.*?),\s*(.*?),\s*(.*?),\s*\$?([\d,.]+)/);
    if (m) {
      items.push({
        vendor: m[1].trim(),
        item: m[2].trim(),
        type: m[3].trim(),
        monthlyCharge: m[4].replace(/,/g, ""),
        status: "Active",
      });
    }
  }
  return items;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const { companyId, loading: companyLoading } = useCompany();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog state for add item
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Bulk import dialog
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);

  // OCR import dialog
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrPreview, setOcrPreview] = useState([]);
  const [ocrError, setOcrError] = useState("");
  const [ocrUploading, setOcrUploading] = useState(false);

  // Form state for single add
  const [vendor, setVendor] = useState("");
  const [item, setItem] = useState("");
  const [type, setType] = useState("");
  const [monthlyCharge, setMonthlyCharge] = useState("");
  const [status, setStatus] = useState("Active");

  // Live inventory (by company)
  useEffect(() => {
    if (!user || !companyId) return;
    setLoading(true);
    const q = query(
      collection(db, "inventory"),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInventory(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [user, companyId]);

  // Add single item
  const handleNewItem = () => setOpen(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (!companyId) throw new Error("No company selected.");
      const docRef = await addDoc(collection(db, "inventory"), {
        companyId,
        userId: user.uid,
        vendor,
        item,
        type,
        monthlyCharge,
        status,
        createdAt: serverTimestamp(),
      });

      // Audit log for single add
      logEvent("inventory.add", {
        inventoryId: docRef.id,
        vendor,
        item,
        type,
        monthlyCharge,
        status,
      }, { companyId });

      setOpen(false);
      setVendor("");
      setItem("");
      setType("");
      setMonthlyCharge("");
      setStatus("Active");
    } catch (err) {
      setError(err.message || "Failed to add inventory item.");
    }
    setSubmitting(false);
  };

  // BULK CSV IMPORT HANDLER
  const handleBulkFile = (e) => {
    setBulkError("");
    setBulkPreview([]);
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data || !Array.isArray(result.data)) {
          setBulkError("CSV parsing failed.");
          return;
        }
        const preview = result.data
          .map((row) => ({
            vendor: row.Vendor || "",
            item: row.Item || "",
            type: row.Type || "",
            monthlyCharge: row["Monthly Charge"] || "",
            status: row.Status || "Active",
          }))
          .filter((r) => r.vendor && r.item && r.type && r.monthlyCharge);
        if (preview.length === 0) {
          setBulkError("No valid inventory rows found in file.");
          return;
        }
        setBulkPreview(preview);
      },
      error: (err) => setBulkError(err.message || "CSV parse error."),
    });
  };

  const handleBulkConfirm = async () => {
    setBulkUploading(true);
    setBulkError("");
    try {
      const batch = writeBatch(db);
      const ids = [];
      for (const row of bulkPreview) {
        const newId = doc(collection(db, "inventory")).id;
        batch.set(doc(db, "inventory", newId), {
          ...row,
          companyId,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        ids.push(newId);
      }
      await batch.commit();

      // Audit log for bulk import
      logEvent("inventory.bulkImport", {
        count: bulkPreview.length,
        ids,
      }, { companyId });

      setBulkOpen(false);
      setBulkPreview([]);
    } catch (err) {
      setBulkError(err.message || "Bulk import failed.");
    }
    setBulkUploading(false);
  };

  // OCR IMPORT HANDLER (image invoices etc.)
  const handleOcrFile = async (e) => {
    setOcrError("");
    setOcrPreview([]);
    setOcrProgress(0);
    setOcrStatus("");
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setOcrError("OCR only supports PNG/JPG images in this demo.");
      return;
    }
    setOcrStatus("Running OCR...");
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target.result;
        const result = await Tesseract.recognize(imageData, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text" && m.progress) {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        });
        const text = result.data.text;
        setOcrStatus("Extracting items...");
        const preview = extractInventoryItemsFromText(text);
        if (preview.length === 0) setOcrError("No inventory items found in image.");
        setOcrPreview(preview);
        setOcrStatus("OCR complete. Please review below.");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setOcrError("OCR failed. Please try a clearer image.");
    }
  };

  const handleOcrConfirm = async () => {
    setOcrUploading(true);
    setOcrError("");
    try {
      const batch = writeBatch(db);
      const ids = [];
      for (const row of ocrPreview) {
        const newId = doc(collection(db, "inventory")).id;
        batch.set(doc(db, "inventory", newId), {
          ...row,
          companyId,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        ids.push(newId);
      }
      await batch.commit();

      // Audit log for OCR import
      logEvent("inventory.ocrImport", {
        count: ocrPreview.length,
        ids,
      }, { companyId });

      setOcrOpen(false);
      setOcrPreview([]);
    } catch (err) {
      setOcrError(err.message || "OCR import failed.");
    }
    setOcrUploading(false);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Inventory
      </Typography>

      {/* Import / Add Buttons */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Add/Import Inventory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track circuits, devices, phones and more.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: { xs: 2, sm: 0 } }}>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleNewItem}
              sx={{ minWidth: 120 }}
              disabled={companyLoading || !companyId}
            >
              New Item
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => setBulkOpen(true)}
              sx={{ minWidth: 120 }}
              disabled={companyLoading || !companyId}
            >
              Import CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<CameraIcon />}
              onClick={() => setOcrOpen(true)}
              sx={{ minWidth: 120 }}
              disabled={companyLoading || !companyId}
            >
              OCR Image
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Single Add Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Inventory Item</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                required
              />
              <TextField
                label="Inventory Item"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                required
              />
              <TextField
                select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                {types.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Monthly Charge"
                value={monthlyCharge}
                onChange={(e) => setMonthlyCharge(e.target.value)}
                required
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
              />
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : "Add"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Inventory from CSV</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {bulkError && <Alert severity="error">{bulkError}</Alert>}
            <Button
              variant="outlined"
              component="label"
              startIcon={<FileUploadIcon />}
            >
              Upload CSV
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={handleBulkFile}
              />
            </Button>
            <Alert severity="info">
              CSV columns: Vendor, Item, Type, Monthly Charge, Status (optional)
            </Alert>
            {bulkPreview.length > 0 && (
              <Box>
                <Typography fontWeight={700} mb={1}>
                  Preview {bulkPreview.length} items:
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Vendor</TableCell>
                        <TableCell>Item</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Monthly Charge</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulkPreview.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.vendor}</TableCell>
                          <TableCell>{row.item}</TableCell>
                          <TableCell>{row.type}</TableCell>
                          <TableCell>${row.monthlyCharge}</TableCell>
                          <TableCell>{row.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkOpen(false)} disabled={bulkUploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!bulkPreview.length || bulkUploading}
            onClick={handleBulkConfirm}
          >
            {bulkUploading ? <CircularProgress size={24} /> : "Import"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* OCR Import Dialog */}
      <Dialog open={ocrOpen} onClose={() => setOcrOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Inventory via OCR (Image Invoice)</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {ocrError && <Alert severity="error">{ocrError}</Alert>}
            <Button
              variant="outlined"
              component="label"
              startIcon={<CameraIcon />}
            >
              Upload Image
              <input
                type="file"
                hidden
                accept=".png,.jpg,.jpeg"
                onChange={handleOcrFile}
              />
            </Button>
            <Alert severity="info">
              Upload a PNG/JPG invoice or list with: Vendor, Item, Type, Cost per line (comma-separated)
            </Alert>
            {ocrStatus && (
              <Alert severity="info">
                {ocrStatus}
                {ocrProgress > 0 && ocrProgress < 100 && (
                  <Box mt={1}><LinearProgress variant="determinate" value={ocrProgress} /></Box>
                )}
              </Alert>
            )}
            {ocrPreview.length > 0 && (
              <Box>
                <Typography fontWeight={700} mb={1}>
                  Preview {ocrPreview.length} items:
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Vendor</TableCell>
                        <TableCell>Item</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Monthly Charge</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ocrPreview.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.vendor}</TableCell>
                          <TableCell>{row.item}</TableCell>
                          <TableCell>{row.type}</TableCell>
                          <TableCell>${row.monthlyCharge}</TableCell>
                          <TableCell>{row.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOcrOpen(false)} disabled={ocrUploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!ocrPreview.length || ocrUploading}
            onClick={handleOcrConfirm}
          >
            {ocrUploading ? <CircularProgress size={24} /> : "Import"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Table */}
      <Typography variant="h6" fontWeight={600} mb={2}>
        Your Inventory
      </Typography>
      {companyLoading || loading ? (
        <CircularProgress />
      ) : inventory.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No inventory items added yet.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Monthly Charge</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.vendor}</TableCell>
                  <TableCell>{inv.item}</TableCell>
                  <TableCell>{inv.type}</TableCell>
                  <TableCell>${inv.monthlyCharge}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        bgcolor:
                          inv.status === "Active"
                            ? "success.light"
                            : inv.status === "Pending"
                            ? "warning.light"
                            : "grey.200",
                        color:
                          inv.status === "Active"
                            ? "success.dark"
                            : inv.status === "Pending"
                            ? "warning.dark"
                            : "text.secondary",
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.5,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {inv.status}
                    </Box>
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
