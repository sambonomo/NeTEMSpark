import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Tooltip,
  Menu,
  MenuItem,
  Button,
  Stack,
  Link,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import useCompany from "../../context/useCompany";

export default function Navbar({ showSidebar }) {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();

  // Profile menu
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Show "Login"/"Signup" for public/unauthenticated users, profile for private/authenticated users
  const publicNav = (
    <Stack direction="row" spacing={2}>
      {location.pathname !== "/login" && (
        <Button color="primary" onClick={() => navigate("/login")}>Login</Button>
      )}
      <Button variant="outlined" color="primary" onClick={() => navigate("/pricing")}>
        Pricing
      </Button>
    </Stack>
  );

  const privateNav = (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography variant="subtitle1" sx={{ color: "text.secondary", fontWeight: 500, ml: 2 }}>
        {company?.name}
      </Typography>
      <Tooltip title={user?.email || "Profile"}>
        <IconButton color="inherit" sx={{ ml: 1 }} onClick={handleMenuOpen}>
          <Avatar alt={user?.email || "User"} src="" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem disabled>
          <Typography variant="body2">{user?.email}</Typography>
        </MenuItem>
        <MenuItem onClick={() => { navigate("/settings"); handleMenuClose(); }}>
          Settings
        </MenuItem>
        <MenuItem onClick={() => { navigate("/team"); handleMenuClose(); }}>
          Team
        </MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </Stack>
  );

  return (
    <AppBar position="static" color="default" elevation={showSidebar ? 1 : 0}>
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <img
            src="/netemspark-logo.png"
            alt="NeTEMSpark Logo"
            style={{ width: 36, height: 36, marginRight: 12 }}
          />
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, letterSpacing: 1 }}>
            NeTEMSpark
          </Typography>
        </Box>
        {user ? privateNav : publicNav}
      </Toolbar>
    </AppBar>
  );
}
