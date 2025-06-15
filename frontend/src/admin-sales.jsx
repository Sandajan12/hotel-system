import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Avatar,
  Grid,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AdminSalesDashboard = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [summary, setSummary] = useState({
    totalPayments: 0,
    totalRevenue: 0,
    totalReservations: 0,
    confirmedReservations: 0,
    pendingReservations: 0
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      
      // Fetch both payments and summary data
      const [paymentsResponse, summaryResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/payments/${year}/${month}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/payments/summary?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!paymentsResponse.ok || !summaryResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const [paymentsData, summaryData] = await Promise.all([
        paymentsResponse.json(),
        summaryResponse.json()
      ]);

      setPayments(paymentsData);
      setSummary({
        totalPayments: summaryData.total_payments || 0,
        totalRevenue: summaryData.total_revenue || 0,
        totalReservations: summaryData.total_reservations || 0,
        confirmedReservations: summaryData.confirmed_reservations || 0,
        pendingReservations: summaryData.pending_reservations || 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (date) => {
    setSelectedMonth(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) return (
    <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
      <CircularProgress />
    </Container>
  );

  if (error) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography color="error">{error}</Typography>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        p: 2,
        backgroundColor: 'primary.main',
        color: 'white',
        borderRadius: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            {localStorage.getItem("username")?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h5">Sales Dashboard</Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin')}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Month Selection */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select Reporting Month
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            views={['year', 'month']}
            label="Select Month"
            value={selectedMonth}
            onChange={handleMonthChange}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </LocalizationProvider>
        <Button 
          variant="contained" 
          onClick={fetchData}
          sx={{ mt: 2 }}
        >
          Refresh Data
        </Button>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Total Payments</Typography>
            <Typography variant="h4" color="primary">{summary.totalPayments}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Total Revenue</Typography>
            <Typography variant="h4" color="success.main">
              {formatCurrency(summary.totalRevenue)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Confirmed Reservations</Typography>
            <Typography variant="h4" color="success.main">{summary.confirmedReservations}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Pending Reservations</Typography>
            <Typography variant="h4" color="warning.main">{summary.pendingReservations}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Payments Table */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Payment Records ({selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })})
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment ID</TableCell>
                <TableCell>Reservation ID</TableCell>
                <TableCell>Guest Name</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Date</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.payment_id}>
                    <TableCell>{payment.payment_id}</TableCell>
                    <TableCell>{payment.reservation_id}</TableCell>
                    <TableCell>{payment.guest_name}</TableCell>
                    <TableCell>{formatCurrency(payment.amount_paid)}</TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>
                      <Box 
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: 
                            payment.status === 'confirmed' ? 'success.light' :
                            payment.status === 'pending' ? 'warning.light' :
                            'error.light',
                          color: 'common.white'
                        }}
                      >
                        {payment.status}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No payment records found for selected month
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default AdminSalesDashboard;