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

const types = [
  { value: "Circuit", label: "Circuit" },
  { value: "Phone", label: "Phone" },
  { value: "Mobile", label: "Mobile" },
  { value: "Hardware", label: "Hardware" },
  { value: "Other", label: "Other" },
];

export default function InventoryPage() {
  const { user } = useAuth();
  const { companyId, loading: companyLoading } = useCompany();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
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

  const handleNewItem = () => setOpen(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (!companyId) throw new Error("No company selected.");
      await addDoc(collection(db, "inventory"), {
        companyId,
        userId: user.uid,
        vendor,
        item,
        type,
        monthlyCharge,
        status,
        createdAt: serverTimestamp(),
      });
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

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Inventory
      </Typography>

      {/* Add New Inventory */}
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
              Add Inventory Item
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track circuits, devices, phones and more.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleNewItem}
            sx={{ minWidth: 180, mt: { xs: 2, sm: 0 } }}
            disabled={companyLoading || !companyId}
          >
            New Inventory Item
          </Button>
        </CardContent>
      </Card>

      {/* Submit Dialog */}
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
