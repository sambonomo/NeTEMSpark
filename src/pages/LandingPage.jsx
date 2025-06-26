import { Box, Typography, Button, Grid, Card, CardContent, Stack, Link } from "@mui/material";
import FeedbackButton from "../components/common/FeedbackButton";

export default function LandingPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 12 }}>
      {/* HERO SECTION */}
      <Box sx={{ pt: 8, pb: 6, textAlign: "center" }}>
        <Typography variant="h2" fontWeight={800} gutterBottom>
          Meet <span style={{ color: "#1976d2" }}>NeTEMSpark</span>
        </Typography>
        <Typography variant="h5" color="text.secondary" mb={4} maxWidth={620} mx="auto">
          The world’s easiest, fastest, and most automated Telecom Expense Management platform—built for modern teams. Onboard in minutes. Save thousands. No sales calls. No legacy pain.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" mt={4}>
          <Button href="/login" variant="contained" size="large">
            Get Started Free
          </Button>
          <Button href="/pricing" variant="outlined" size="large">
            See Pricing
          </Button>
        </Stack>
        <Box mt={4}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Link href="/login" underline="hover">
              Log in
            </Link>
          </Typography>
        </Box>
      </Box>

      {/* FEATURE GRID */}
      <Grid container spacing={4} maxWidth="lg" mx="auto" justifyContent="center">
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                <span role="img" aria-label="rocket">🚀</span> Instant Onboarding
              </Typography>
              <Typography color="text.secondary">
                Sign up, invite your team, and upload contracts in under 10 minutes. No implementation calls. No waitlists.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                <span role="img" aria-label="bolt">⚡️</span> Automation Everywhere
              </Typography>
              <Typography color="text.secondary">
                OCR contract import, renewal alerts, billing audits, live dashboards, and automated MAC requests—out of the box.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                <span role="img" aria-label="group">👥</span> True Team Collaboration
              </Typography>
              <Typography color="text.secondary">
                Multi-user, role-based access, real-time invites, feedback tools, and audit trails. No more “admin-only” portals.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* COMPARISON */}
      <Box mt={10} mb={4} textAlign="center">
        <Typography variant="h5" fontWeight={700} mb={3}>
          Why switch to NeTEMSpark?
        </Typography>
        <Grid container spacing={2} maxWidth="md" mx="auto" alignItems="center">
          <Grid item xs={6}>
            <Card elevation={0} sx={{ bgcolor: "#e3f2fd", border: "1px solid #90caf9" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>NeTEMSpark</Typography>
                <ul style={{ textAlign: "left", marginTop: 12, marginBottom: 0 }}>
                  <li>⚡ Instant onboarding (no waiting!)</li>
                  <li>👥 Add users anytime</li>
                  <li>🔍 Search and audit everything</li>
                  <li>📈 Live dashboards and alerts</li>
                  <li>💰 Transparent pricing—no surprises</li>
                  <li>🤝 Modern, mobile-friendly UI</li>
                </ul>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card elevation={0} sx={{ border: "1px solid #eee" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                  Legacy TEMs
                </Typography>
                <ul style={{ textAlign: "left", marginTop: 12, marginBottom: 0, color: "#aaa" }}>
                  <li>🕑 Weeks to onboard</li>
                  <li>👤 Only admins can invite</li>
                  <li>🔒 Black-box reporting</li>
                  <li>📉 Quarterly reviews, not real-time</li>
                  <li>❓ Opaque pricing & sales calls</li>
                  <li>💻 Dated portals, not SaaS</li>
                </ul>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* FEEDBACK BUTTON */}
      <FeedbackButton />

      {/* FOOTER */}
      <Box mt={12} textAlign="center" color="text.secondary" fontSize={14}>
        © {new Date().getFullYear()} NeTEMSpark. All rights reserved.
      </Box>
    </Box>
  );
}
