import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useAuth } from "../context/AuthContext";
import useCompany from "../context/useCompany";

export default function SettingsPage() {
  const { user } = useAuth();
  const { company, loading: companyLoading } = useCompany();

  // Placeholder handler for change password
  const handleChangePassword = () => {
    alert("TODO: Implement secure password reset flow!");
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
            <TextField
              label="Email"
              type="email"
              value={user?.email || ""}
              disabled
              fullWidth
            />
            <TextField
              label="Company"
              value={companyLoading ? "Loading..." : company?.name || ""}
              disabled
              fullWidth
            />
            <Divider />
            <TextField
              label="Password"
              type="password"
              value="********"
              disabled
              fullWidth
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleChangePassword}
              sx={{ alignSelf: "flex-start" }}
            >
              Change Password
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
