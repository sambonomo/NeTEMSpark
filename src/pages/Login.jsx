import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";

function useQuery() {
  // Parse query params
  const { search } = useLocation();
  return Object.fromEntries(new URLSearchParams(search));
}

export default function Login() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const queryParams = useQuery();

  const [tab, setTab] = useState(0); // 0 = Login, 1 = Signup

  // Shared state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // For signup
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState(queryParams.invite || "");
  const [inviteStatus, setInviteStatus] = useState(""); // info or error
  const [inviteObj, setInviteObj] = useState(null);

  // Detect invite from URL param
  useEffect(() => {
    if (tab !== 1) return;
    const checkInvite = async () => {
      setInviteStatus("");
      setInviteObj(null);
      if (!inviteCode) return;
      // Find invite in Firestore (by code or email for MVP)
      // For now, treat the code as invite doc ID
      try {
        const inviteRef = doc(db, "invites", inviteCode); // For global invites
        // Or look for invite in company collections
        let found = null;
        // Find invite by code in all companies
        const companiesSnap = await getDocs(collection(db, "companies"));
        for (const companyDoc of companiesSnap.docs) {
          const invitesSnap = await getDocs(collection(db, "companies", companyDoc.id, "invites"));
          const match = invitesSnap.docs.find((i) => i.id === inviteCode);
          if (match) {
            found = { ...match.data(), id: match.id, companyId: companyDoc.id, docPath: match.ref.path };
            break;
          }
        }
        if (!found) {
          setInviteStatus("Invalid or expired invite code.");
          setInviteObj(null);
        } else {
          setInviteObj(found);
          setCompanyName(found.companyName || "");
          setInviteStatus(`Joining: ${found.companyName || "(company)"} as ${found.role}`);
        }
      } catch {
        setInviteStatus("Invalid or expired invite code.");
      }
    };
    checkInvite();
    // eslint-disable-next-line
  }, [inviteCode, tab]);

  const handlePasteInvite = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInviteCode(text);
    } catch {
      setInviteStatus("Could not access clipboard.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setProcessing(true);

    try {
      if (tab === 0) {
        await login(email.trim(), password);
        navigate("/dashboard");
      } else {
        // Signup path
        if (inviteCode) {
          if (!inviteObj) throw new Error("Invalid invite code.");
          // 1. Create user
          const cred = await signup(email.trim(), password);
          // 2. Add user as member of company with invite role
          await setDoc(doc(db, "companies", inviteObj.companyId, "members", cred.user.uid), {
            email: email.trim(),
            role: inviteObj.role,
            joinedAt: serverTimestamp(),
          });
          // 3. Add user profile with companyId
          await setDoc(doc(db, "users", cred.user.uid), {
            email: email.trim(),
            companyId: inviteObj.companyId,
          });
          // 4. Delete the invite
          await deleteDoc(doc(db, inviteObj.docPath));
          setSignupSuccess(true);
          setTab(0);
        } else {
          // Open (admin) signup—must provide a company name
          if (!companyName.trim()) throw new Error("Company name is required.");
          // 1. Create user
          const cred = await signup(email.trim(), password);
          // 2. Create company in Firestore
          const companyRef = await addDoc(collection(db, "companies"), {
            name: companyName.trim(),
            createdAt: serverTimestamp(),
          });
          // 3. Save user profile with companyId
          await setDoc(doc(db, "users", cred.user.uid), {
            email: email.trim(),
            companyId: companyRef.id,
          });
          // 4. Add user as admin member
          await setDoc(doc(db, "companies", companyRef.id, "members", cred.user.uid), {
            email: email.trim(),
            role: "admin",
            joinedAt: serverTimestamp(),
          });
          setSignupSuccess(true);
          setTab(0);
        }
      }
    } catch (err) {
      setError(
        err?.message?.replace("Firebase:", "").replace("auth/", "").replace(/-/g, " ") ||
          "An error occurred"
      );
    }
    setProcessing(false);
  };

  // Already logged in? Redirect
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
      <Card sx={{ width: 370, p: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box textAlign="center" mb={1}>
              <img
                src="/netemspark-logo.2.png"
                alt="NeTEMSpark Logo"
                style={{ width: 48, height: 48, marginBottom: 4 }}
              />
              <Typography variant="h5" fontWeight={700}>
                NeTEMSpark
              </Typography>
            </Box>
            <Tabs
              value={tab}
              onChange={(_, v) => {
                setTab(v);
                setError("");
                setSignupSuccess(false);
              }}
            >
              <Tab label="Login" />
              <Tab label="Sign Up" />
            </Tabs>
            {error && <Alert severity="error">{error}</Alert>}
            {signupSuccess && (
              <Alert severity="success">Account created! Please log in.</Alert>
            )}
            <form onSubmit={handleSubmit} autoComplete="off">
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  autoComplete="username"
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  autoComplete={tab === 0 ? "current-password" : "new-password"}
                  required
                />
                {tab === 1 && (
                  <>
                    <TextField
                      label="Invite Code (if you have one)"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Paste from clipboard">
                              <IconButton onClick={handlePasteInvite} edge="end" size="small">
                                <ContentPasteIcon />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {inviteStatus && (
                      <Alert severity={inviteObj ? "info" : "warning"} sx={{ my: 1 }}>
                        {inviteStatus}
                      </Alert>
                    )}
                    {!inviteCode && (
                      <TextField
                        label="Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        fullWidth
                        required
                      />
                    )}
                  </>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={processing}
                  fullWidth
                  size="large"
                >
                  {tab === 0 ? "Login" : "Create Account"}
                </Button>
              </Stack>
            </form>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
