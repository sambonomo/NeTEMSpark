import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonIcon from "@mui/icons-material/Person";
import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import useCompany from "../context/useCompany";
import { logEvent } from "../utils/logEvent"; // <-- ADD THIS

const roles = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

export default function TeamPage() {
  const { user } = useAuth();
  const { companyId, company, loading: companyLoading } = useCompany();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite dialog state
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Load members and invites
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);

    // Members subcollection
    const qMembers = collection(db, "companies", companyId, "members");
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      setMembers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Invites subcollection
    const qInvites = collection(db, "companies", companyId, "invites");
    const unsubInvites = onSnapshot(qInvites, (snap) => {
      setInvites(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubMembers();
      unsubInvites();
    };
  }, [companyId]);

  // RBAC: Compute role for this user
  const myMember = useMemo(
    () => members.find((m) => m.email === user?.email),
    [members, user]
  );
  const isAdmin = myMember?.role === "admin" || (!myMember && members.length === 1); // First user is admin

  // Handle invite
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError("");
    setSubmitting(true);
    try {
      const emailTrimmed = inviteEmail.trim().toLowerCase();
      if (!emailTrimmed) throw new Error("Email required");
      // Check for existing member or pending invite
      if (
        members.find((m) => m.email === emailTrimmed) ||
        invites.find((i) => i.email === emailTrimmed)
      ) {
        throw new Error("User already invited or a member.");
      }
      const docRef = await addDoc(collection(db, "companies", companyId, "invites"), {
        email: emailTrimmed,
        role: inviteRole,
        status: "Pending",
        invitedBy: user.email,
        invitedAt: serverTimestamp(),
      });

      // Audit log for invite
      logEvent("user.invite", {
        inviteId: docRef.id,
        invitedEmail: emailTrimmed,
        role: inviteRole,
        invitedBy: user.email,
      }, { companyId });

      setOpen(false);
      setInviteEmail("");
      setInviteRole("member");
    } catch (err) {
      setInviteError(err.message || "Failed to send invite.");
    }
    setSubmitting(false);
  };

  return (
    <Box maxWidth={720}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Team Members{" "}
        <GroupAddIcon sx={{ fontSize: 32, ml: 1, mb: "-8px", color: "primary.main" }} />
      </Typography>
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <PersonIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              {user?.email}
            </Typography>
            <Chip
              label={isAdmin ? "Admin" : "Member"}
              color={isAdmin ? "primary" : "default"}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
          <Typography variant="h6" fontWeight={600} mt={2}>
            {companyLoading ? "Loading..." : company?.name || ""}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Invite teammates to collaborate and manage your company’s telecom.
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<GroupAddIcon />}
              onClick={() => setOpen(true)}
              sx={{ mt: 2 }}
            >
              Invite User
            </Button>
          )}
          {!isAdmin && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Only company admins can invite new users.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Members Table */}
      <Typography variant="h6" fontWeight={600} mb={2}>
        Members
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={m.role === "admin" ? "Admin" : "Member"}
                      color={m.role === "admin" ? "primary" : "default"}
                      size="small"
                    />
                  </TableCell>
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
                      Active
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {invites.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={i.role === "admin" ? "Admin" : "Member"}
                      color={i.role === "admin" ? "primary" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        bgcolor: "warning.light",
                        color: "warning.dark",
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.5,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      Pending Invite
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Invite User Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Invite User</DialogTitle>
        <form onSubmit={handleInvite}>
          <DialogContent>
            <Stack spacing={2}>
              {inviteError && <Alert severity="error">{inviteError}</Alert>}
              <TextField
                label="Email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                fullWidth
                required
              />
              <TextField
                select
                label="Role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                fullWidth
                required
              >
                {roles.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : "Send Invite"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
