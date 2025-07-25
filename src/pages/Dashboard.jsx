import {
  Grid,
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
  Button,
  Stack,
  Box,
} from "@mui/material";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
} from "firebase/firestore";
import useCompany from "../context/useCompany";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import DescriptionIcon from "@mui/icons-material/Description";
import StorageIcon from "@mui/icons-material/Storage";

export default function Dashboard() {
  const { companyId, loading: companyLoading } = useCompany();

  // Stats
  const [contracts, setContracts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [advisories, setAdvisories] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(() =>
    localStorage.getItem("ntemspark-onboarding") !== "dismissed"
  );

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);

    // Contracts
    const qContracts = query(
      collection(db, "contracts"),
      where("companyId", "==", companyId)
    );
    const unsubContracts = onSnapshot(qContracts, (snap) => {
      setContracts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Inventory
    const qInventory = query(
      collection(db, "inventory"),
      where("companyId", "==", companyId)
    );
    const unsubInventory = onSnapshot(qInventory, (snap) => {
      setInventory(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Advisory Events
    const qAdvisory = query(
      collection(db, "advisoryEvents"),
      where("companyId", "==", companyId)
    );
    const unsubAdvisory = onSnapshot(qAdvisory, (snap) => {
      setAdvisories(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Members (for onboarding)
    getDocs(collection(db, "companies", companyId, "members")).then((snap) => {
      setMembers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubContracts();
      unsubInventory();
      unsubAdvisory();
    };
  }, [companyId]);

  // Stat calculations
  const ytdSpend = contracts
    .filter((c) => c.status === "Active")
    .reduce((sum, c) => sum + Number(c.monthlyCost || 0) * 12, 0);

  const activeContracts = contracts.filter((c) => c.status === "Active").length;
  const inventoryLines = inventory.length;
  const savingsFound = advisories.reduce(
    (sum, adv) => sum + Number(adv.potentialSavings || 0) * 12,
    0
  );

  // Upcoming renewals (next 60 days)
  const today = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(today.getDate() + 60);

  const upcomingRenewals = contracts
    .filter((c) => {
      const end = c.endDate && new Date(c.endDate);
      return (
        end &&
        end > today &&
        end <= sixtyDaysFromNow &&
        c.status === "Active"
      );
    })
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

  // Onboarding steps detection
  const hasContracts = contracts.length > 0;
  const hasInventory = inventory.length > 0;
  const hasTeam = members.length > 1; // you + at least one teammate

  if (companyLoading || loading) {
    return <CircularProgress />;
  }

  return (
    <div>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Dashboard
      </Typography>

      {/* Onboarding Checklist */}
      {showOnboarding && (
        <Card variant="outlined" sx={{ mb: 4, bgcolor: "#e3f2fd" }}>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} alignItems="center" spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={700} mb={1}>
                  👋 Welcome to NeTEMSpark!
                </Typography>
                <Typography color="text.secondary" mb={1}>
                  Here’s how to get started:
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DescriptionIcon fontSize="small" />
                    <Typography variant="body2">
                      <span style={{ color: hasContracts ? "#388e3c" : "#888", fontWeight: 600 }}>
                        {hasContracts ? <CheckCircleIcon color="success" fontSize="small" /> : "○"}
                      </span>
                      {" "}
                      Upload your first contract
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StorageIcon fontSize="small" />
                    <Typography variant="body2">
                      <span style={{ color: hasInventory ? "#388e3c" : "#888", fontWeight: 600 }}>
                        {hasInventory ? <CheckCircleIcon color="success" fontSize="small" /> : "○"}
                      </span>
                      {" "}
                      Add inventory (circuit, phone, or device)
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <GroupAddIcon fontSize="small" />
                    <Typography variant="body2">
                      <span style={{ color: hasTeam ? "#388e3c" : "#888", fontWeight: 600 }}>
                        {hasTeam ? <CheckCircleIcon color="success" fontSize="small" /> : "○"}
                      </span>
                      {" "}
                      Invite your team
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setShowOnboarding(false);
                  localStorage.setItem("ntemspark-onboarding", "dismissed");
                }}
                sx={{ mt: { xs: 2, md: 0 }, minWidth: 160 }}
              >
                Dismiss
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Spend (YTD)
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                ${ytdSpend.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Across all contracts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Contracts
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {activeContracts}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Expiring soon: {upcomingRenewals.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Inventory Lines
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {inventoryLines}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                All vendors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Savings Found
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary">
                ${savingsFound.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                In last 12 months
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Renewals Table */}
      <Typography variant="h6" fontWeight={600} mb={2}>
        Upcoming Contract Renewals
      </Typography>
      {upcomingRenewals.length === 0 ? (
        <Alert severity="info">No contracts expiring in the next 60 days.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Monthly Cost</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcomingRenewals.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.vendor}</TableCell>
                  <TableCell>{c.service}</TableCell>
                  <TableCell>{c.endDate}</TableCell>
                  <TableCell>${c.monthlyCost}</TableCell>
                  <TableCell>
                    <Typography
                      component="a"
                      href={c.fileUrl || "#"}
                      color="primary"
                      sx={{ textDecoration: "underline", cursor: "pointer" }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Contract
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
