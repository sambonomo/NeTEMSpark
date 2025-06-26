import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import StorageIcon from "@mui/icons-material/Storage";
import SavingsIcon from "@mui/icons-material/Savings";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SettingsIcon from "@mui/icons-material/Settings";
import GroupIcon from "@mui/icons-material/Group";
import { useLocation, Link } from "react-router-dom";

const drawerWidth = 220;

const navItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { text: "Contracts", icon: <DescriptionIcon />, path: "/contracts" },
  { text: "Inventory", icon: <StorageIcon />, path: "/inventory" },
  { text: "Advisory", icon: <SavingsIcon />, path: "/advisory" },
  { text: "MAC Requests", icon: <SyncAltIcon />, path: "/mac-requests" },
  { text: "Billing", icon: <ReceiptIcon />, path: "/billing" },
  { text: "Team", icon: <GroupIcon />, path: "/team" },
  { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          borderRight: "1px solid #e0e0e0",
        },
      }}
    >
      {/* Space below AppBar */}
      <Toolbar />
      <Box sx={{ overflow: "auto", display: "flex", flexDirection: "column", height: "100%" }}>
        <List sx={{ flexGrow: 1 }}>
          {navItems.map((item) => (
            <ListItem
              key={item.path}
              disablePadding
              selected={location.pathname.startsWith(item.path)}
              sx={{
                bgcolor: location.pathname.startsWith(item.path)
                  ? "action.selected"
                  : "inherit",
              }}
            >
              <ListItemButton component={Link} to={item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2, textAlign: "center", fontSize: 12, color: "text.secondary" }}>
          © {new Date().getFullYear()} NeTEMSpark.
        </Box>
      </Box>
    </Drawer>
  );
}
