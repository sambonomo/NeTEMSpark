import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  // If not logged in, redirect to /login
  if (!user) return <Navigate to="/login" replace />;

  // Otherwise, render children (the app shell)
  return children;
}
