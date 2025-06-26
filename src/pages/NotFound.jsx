import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      minHeight="60vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      gap={3}
    >
      <ErrorOutlineIcon sx={{ fontSize: 60, color: "primary.main" }} />
      <Typography variant="h2" fontWeight={700} color="primary">
        404
      </Typography>
      <Typography variant="h5" fontWeight={600}>
        Page Not Found
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Sorry, we couldn't find the page you were looking for.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={() => navigate("/dashboard")}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
}
