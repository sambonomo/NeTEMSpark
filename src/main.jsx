import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

// MUI imports
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "light", // change to 'dark' for default dark mode
    primary: { main: "#1976d2" },
    background: { default: "#f5f6fa" },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
