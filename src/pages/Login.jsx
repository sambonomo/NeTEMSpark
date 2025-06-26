import { useState } from "react";
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
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";

export default function Login() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState(0); // 0 = Login, 1 = Signup

  // Shared state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // For signup
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setProcessing(true);

    try {
      if (tab === 0) {
        await login(email.trim(), password);
        navigate("/dashboard");
      } else {
        if (!companyName.trim()) throw new Error("Company name is required.");
        await signup(email.trim(), password);
        setSignupSuccess(true);
        setTab(0);
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
                  <TextField
                    label="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    fullWidth
                    required
                  />
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
