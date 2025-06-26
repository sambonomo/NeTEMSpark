import { Fab, Tooltip } from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";

export default function FeedbackButton() {
  return (
    <Tooltip title="Suggest an improvement" placement="left">
      <Fab
        color="primary"
        href="mailto:sam.bonomo@netsparktelecom.com?subject=NeTEMSpark%20Feedback"
        sx={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 2000,
        }}
      >
        <FeedbackIcon />
      </Fab>
    </Tooltip>
  );
}
