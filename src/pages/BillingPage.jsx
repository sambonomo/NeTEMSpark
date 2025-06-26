import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import useCompany from "../context/useCompany";
import { useAuth } from "../context/AuthContext";
import { useMemo, useState, useEffect } from "react";

// Placeholder invoices (replace with Stripe data integration)
const exampleInvoices = [
  {
    id: "inv1",
    date: "2025-06-01",
    amount: 299,
    status: "Paid",
    pdfUrl: "#",
  },
];

export default function BillingPage() {
  const { company, loading: companyLoading } = useCompany();
  const { user } = useAuth();

  // Invoices state (future: load from Stripe)
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices] = useState(false);

  // Example: Simulate invoice data for now
  useEffect(() => {
    setInvoices(exampleInvoices);
  }, []);

  // Plan/renewal logic (stub; in production, fetch from company or Stripe data)
  const plan = company?.plan || "Team";
  const nextRenewal = company?.nextRenewal || "2025-07-25";

  // RBAC: Figure out role (admin or member)
  const myRole = useMemo(() => {
    // If company has members array, try to find role for current email
    if (company && Array.isArray(company.members) && user?.email) {
      const member = company.members.find((m) => m.email === user.email);
      return member?.role || "member";
    }
    // Fallback: assume admin if not found
    return "admin";
  }, [company, user]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Billing & Subscription{" "}
        <PaymentIcon sx={{ fontSize: 30, ml: 1, mb: "-6px", color: "primary.main" }} />
      </Typography>

      {/* Current Plan */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          {companyLoading ? (
            <CircularProgress />
          ) : (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Your Subscription
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Chip
                    label={plan}
                    color={plan === "Enterprise" ? "secondary" : "primary"}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={company?.name || ""}
                    color="default"
                    variant="outlined"
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Next renewal: {nextRenewal}
                </Typography>
              </Box>
              {myRole === "admin" ? (
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ minWidth: 180 }}
                  onClick={() => {
                    // TODO: Connect to Stripe Customer Portal or manage billing page
                    alert("Coming soon: Connect to Stripe/RevenueCat/etc.");
                  }}
                >
                  Manage Billing
                </Button>
              ) : (
                <Alert severity="info" sx={{ minWidth: 180 }}>
                  Only company admins can manage billing.
                </Alert>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Typography variant="h6" fontWeight={600} mb={2}>
        Invoices
      </Typography>
      {loadingInvoices ? (
        <CircularProgress />
      ) : invoices.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No invoices yet. Your future invoices will appear here.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Download</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell>${inv.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        bgcolor: inv.status === "Paid" ? "success.light" : "warning.light",
                        color: inv.status === "Paid" ? "success.dark" : "warning.dark",
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
                  <TableCell>
                    <Button
                      variant="text"
                      color="primary"
                      size="small"
                      href={inv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Divider sx={{ mt: 6, mb: 2 }} />
      <Typography variant="body2" color="text.secondary" mt={2}>
        Need help? Contact <a href="mailto:support@netemspark.com">support@netemspark.com</a>
      </Typography>
    </Box>
  );
}
