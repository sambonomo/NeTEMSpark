import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useAuth } from "../context/AuthContext";
import useCompany from "../context/useCompany";
import { useState, useMemo } from "react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { company, loading: companyLoading } = useCompany();

  // Simulate member role: You may want to pull this from company.members
  const myRole = useMemo(() => {
    // You could get real role from a context, or from a members subcollection (as in TeamPage)
    // Here, if the company has a 'members' array, try to find the role for this email
    if (company && Array.isArray(company.members) && user?.email) {
      const member = company.members.find((m) => m.email === user.email);
      return member?.role || "member";
    }
    // Fallback: if company has no info, assume admin (first user is usually admin)
    return "admin";
  }, [company, user]);

  // Password modal state
  const [pwOpen, setPwOpen] = useState(false);

  // Placeholder handler for password update
  const [pwValue, setPwValue] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const handleChangePassword = async () => {
    setPwOpen(true);
    setPwError("");
    setPwSuccess("");
    setPwValue("");
    setPwConfirm("");
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (pwValue.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (pwValue !== pwConfirm) {
      setPwError("Passwords do not match.");
      return;
    }
    // TODO: Integrate with Firebase Auth updatePassword flow
    setPwSuccess("Password updated! (Simulated)");
    setTimeout(() => setPwOpen(false), 1500);
  };

  return (
    <Box maxWidth={520}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Settings{" "}
        <SettingsIcon sx={{ fontSize: 30, ml: 1, mb: "-6px", color: "primary.main" }} />
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <TextField
                label="Email"
                type="email"
                value={user?.email || ""}
                disabled
                fullWidth
                sx={{ mb: 1 }}
              />
              {companyLoading ? (
                <Skeleton width={210} />
              ) : (
                <TextField
                  label="Company"
                  value={company?.name || ""}
                  disabled
                  fullWidth
                  sx={{ mb: 1 }}
                />
              )}
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                <Chip
                  label={myRole === "admin" ? "Admin" : "Member"}
                  color={myRole === "admin" ? "primary" : "default"}
                  variant="outlined"
                  size="small"
                />
                {company?.id && (
                  <Chip
                    label={`Company ID: ${company.id.slice(0, 8)}...`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
            <Divider />
            <Box>
              <TextField
                label="Password"
                type="password"
                value="********"
                disabled
                fullWidth
                sx={{ mb: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleChangePassword}
                sx={{ alignSelf: "flex-start" }}
              >
                Change Password
              </Button>
            </Box>
            {myRole === "admin" && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    Company Admin Actions
                  </Typography>
                  {/* Optional: Add plan management, billing, or company rename here */}
                  <Alert severity="info">
                    Admin-only features go here. (Billing, company rename, delete, etc.)
                  </Alert>
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={pwOpen} onClose={() => setPwOpen(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <form onSubmit={handlePwSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              {pwError && <Alert severity="error">{pwError}</Alert>}
              {pwSuccess && <Alert severity="success">{pwSuccess}</Alert>}
              <TextField
                label="New Password"
                type="password"
                value={pwValue}
                onChange={(e) => setPwValue(e.target.value)}
                autoFocus
                fullWidth
                required
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                fullWidth
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Update
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
