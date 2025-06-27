import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Stack,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  TablePagination,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import useCompany from "../context/useCompany";

const EVENT_TYPES = [
  "contract.add",
  "inventory.add",
  "inventory.bulkImport",
  "inventory.ocrImport",
  "user.invite",
  "macRequest.add",
  // add more event types as you add features!
];

export default function AuditTrailPage() {
  const { user } = useAuth();
  const { companyId, loading: companyLoading } = useCompany();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [eventType, setEventType] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Live logs (by company)
  useEffect(() => {
    if (!user || !companyId) return;
    setLoading(true);

    let q = query(
      collection(db, "auditLogs"),
      where("companyId", "==", companyId),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setLogs(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
      setLoading(false);
    });
    return unsub;
  }, [user, companyId]);

  // Filtered logs (memoized)
  const filteredLogs = useMemo(() => {
    let filtered = logs;
    if (eventType) filtered = filtered.filter((log) => log.eventType === eventType);
    if (userEmail) filtered = filtered.filter(
      (log) => (log.userEmail || "").toLowerCase().includes(userEmail.toLowerCase())
    );
    if (search) {
      filtered = filtered.filter(
        (log) =>
          JSON.stringify(log.details || {})
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [logs, eventType, userEmail, search]);

  // Paginated logs
  const paginatedLogs = useMemo(
    () =>
      filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredLogs, page, rowsPerPage]
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Audit Trail
      </Typography>

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="eventType-label">Event Type</InputLabel>
              <Select
                labelId="eventType-label"
                value={eventType}
                label="Event Type"
                onChange={(e) => {
                  setEventType(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                {EVENT_TYPES.map((ev) => (
                  <MenuItem value={ev} key={ev}>
                    {ev}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="User Email"
              value={userEmail}
              onChange={(e) => {
                setUserEmail(e.target.value);
                setPage(0);
              }}
              size="small"
              sx={{ minWidth: 180 }}
            />
            <TextField
              label="Search Details"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              size="small"
              sx={{ minWidth: 180 }}
              InputProps={{
                endAdornment: <SearchIcon fontSize="small" />,
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {companyLoading || loading ? (
        <CircularProgress />
      ) : filteredLogs.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No audit log entries found for your company.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.timestamp?.toDate
                        ? log.timestamp.toDate().toLocaleString()
                        : ""}
                    </TableCell>
                    <TableCell>
                      <strong>{log.eventType}</strong>
                    </TableCell>
                    <TableCell>
                      {log.userEmail || <em>system</em>}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          whiteSpace: "pre-wrap",
                          fontFamily: "monospace",
                          fontSize: 13,
                        }}
                      >
                        {JSON.stringify(log.details || {}, null, 2)}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredLogs.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </>
      )}
    </Box>
  );
}
