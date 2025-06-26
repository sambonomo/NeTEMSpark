import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  Link,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FeedbackButton from "../components/common/FeedbackButton";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For individuals and very small teams exploring basic TEM.",
    features: [
      "Unlimited contract & inventory uploads",
      "Renewal & billing alerts",
      "1 user only",
      "OCR import (10 docs/month)",
      "Live dashboard",
      "Automated MAC requests",
      "Email support",
    ],
    cta: { label: "Get Started", href: "/login", variant: "outlined" },
  },
  {
    name: "Team",
    price: "$99/mo",
    description: "For modern SMB teams who want the easiest TEM ever.",
    features: [
      "Everything in Starter, plus:",
      "Unlimited users",
      "Unlimited OCR/import",
      "Team invites & roles",
      "Bulk export & reporting",
      "API access (beta)",
      "Priority email & chat support",
    ],
    cta: { label: "Start Free Trial", href: "/login", variant: "contained" },
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Contact Us",
    description: "For organizations with advanced needs and high-volume TEM.",
    features: [
      "Everything in Team, plus:",
      "Custom onboarding",
      "SAML SSO, advanced permissions",
      "White-glove migration",
      "Dedicated account manager",
      "Custom analytics",
      "Audit & compliance exports",
      "Premium support SLA",
    ],
    cta: { label: "Contact Sales", href: "mailto:sales@netemspark.com", variant: "outlined" },
  },
];

export default function PricingPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 8 }}>
      {/* HEADER */}
      <Box sx={{ pt: 8, pb: 5, textAlign: "center" }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Transparent, Flexible Pricing
        </Typography>
        <Typography variant="h6" color="text.secondary" maxWidth={700} mx="auto">
          No hidden fees. No annual lock-in. Cancel anytime.  
          Try NeTEMSpark free and see why teams everywhere are leaving legacy TEMs behind.
        </Typography>
      </Box>

      {/* PLANS */}
      <Grid container spacing={4} maxWidth="lg" mx="auto" justifyContent="center">
        {plans.map((plan, i) => (
          <Grid item xs={12} sm={6} md={4} key={plan.name}>
            <Card
              elevation={plan.highlight ? 8 : 2}
              sx={{
                border: plan.highlight ? "2px solid #1976d2" : "1px solid #eee",
                transform: plan.highlight ? "scale(1.05)" : "none",
              }}
            >
              <CardHeader
                title={plan.name}
                titleTypographyProps={{ align: "center", fontWeight: 700 }}
                sx={{
                  bgcolor: plan.highlight ? "primary.main" : "grey.100",
                  color: plan.highlight ? "common.white" : "text.primary",
                }}
              />
              <CardContent sx={{ textAlign: "center" }}>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  color={plan.highlight ? "primary.main" : "text.primary"}
                  mb={1}
                  sx={{ fontSize: plan.price === "Free" ? 38 : 44 }}
                >
                  {plan.price}
                  {plan.price === "$99/mo" && (
                    <span style={{ fontWeight: 400, fontSize: 20, color: "#888" }}> /month</span>
                  )}
                </Typography>
                <Typography
                  color={plan.highlight ? "common.white" : "text.secondary"}
                  mb={2}
                  fontSize={17}
                >
                  {plan.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List dense>
                  {plan.features.map((f) => (
                    <ListItem key={f} disableGutters>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={f}
                        primaryTypographyProps={{
                          color: plan.highlight ? "common.white" : "text.primary",
                          fontSize: 16,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                <Stack alignItems="center" mt={3}>
                  <Button
                    variant={plan.cta.variant}
                    color="primary"
                    href={plan.cta.href}
                    size="large"
                    sx={{
                      minWidth: 160,
                      fontWeight: 700,
                      bgcolor: plan.highlight ? "primary.main" : undefined,
                      color: plan.highlight ? "common.white" : undefined,
                      boxShadow: plan.highlight ? 2 : undefined,
                      "&:hover": {
                        bgcolor: plan.highlight ? "primary.dark" : undefined,
                      },
                    }}
                  >
                    {plan.cta.label}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* FAQ */}
      <Box mt={10} maxWidth={800} mx="auto">
        <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
          Frequently Asked Questions
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Stack spacing={4}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Do I need to talk to sales to get started?
            </Typography>
            <Typography color="text.secondary">
              Nope! You can sign up and start using NeTEMSpark immediately with the free Starter plan.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Is there a free trial for the Team plan?
            </Typography>
            <Typography color="text.secondary">
              Yes. You can try all Team features free for 14 days—no credit card required. Upgrade or downgrade anytime.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              What about support?
            </Typography>
            <Typography color="text.secondary">
              All plans include email support. Team and Enterprise plans include chat and premium SLAs.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Can I export my data?
            </Typography>
            <Typography color="text.secondary">
              Absolutely. Your contracts, inventory, and reports are always yours—export in one click.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Do you offer onboarding/migration help?
            </Typography>
            <Typography color="text.secondary">
              Yes! Our Customer Success team can migrate your data and users. Enterprise plans get a dedicated manager.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* CTA */}
      <Box mt={8} mb={4} textAlign="center">
        <Button variant="contained" color="primary" size="large" href="/login" sx={{ px: 4 }}>
          Start Free &rarr;
        </Button>
      </Box>

      {/* FEEDBACK BUTTON */}
      <FeedbackButton />

      {/* FOOTER */}
      <Box mt={8} textAlign="center" color="text.secondary" fontSize={14}>
        © {new Date().getFullYear()} NeTEMSpark. All rights reserved.
      </Box>
    </Box>
  );
}
