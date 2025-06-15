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
  TextField,
  Button,
  Box,
  Avatar,
  InputAdornment,
  IconButton,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { Search as SearchIcon, Logout as LogoutIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('reservation_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState('');
  const [role, setRole] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    if (storedUser && storedRole) {
      setUser(storedUser);
      setRole(storedRole);
      fetchReservations();
      if (storedRole !== "employee") {
        navigate("/admin")
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/reservations", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch reservations");
      
      const data = await response.json();
      setReservations(data);
      setFilteredReservations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async (reservationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/reservations/${reservationId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error("Failed to confirm reservation");
      
      setReservations(reservations.map(res => 
        res.reservation_id === reservationId 
          ? { ...res, status: 'confirmed' } 
          : res
      ));
      setFilteredReservations(filteredReservations.map(res => 
        res.reservation_id === reservationId 
          ? { ...res, status: 'confirmed' } 
          : res
      ));
      
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredReservations(reservations);
      return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    const filtered = reservations.filter(reservation => {
      if (searchType === 'reservation_id') {
        return reservation.reservation_id.toString().startsWith(term);
      } else if (searchType === 'guest_name') {
        return reservation.guest_name.toLowerCase().includes(term);
      }
      return true;
    });
    
    setFilteredReservations(filtered);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
            {user.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h5">Employee Dashboard</Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            navigate("/");
          }}
        >
          Logout
        </Button>
      </Box>

      {/* Search and Filter Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Search Reservations
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="search-type-label">Search By</InputLabel>
            <Select
              labelId="search-type-label"
              value={searchType}
              label="Search By"
              onChange={(e) => setSearchType(e.target.value)}
            >
              <MenuItem value="reservation_id">Reservation ID</MenuItem>
              <MenuItem value="guest_name">Guest Name</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label={searchType === 'reservation_id' ? 'Search by Reservation ID' : 'Search by Guest Name'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSearch}
            sx={{ height: 56 }}
          >
            Search
          </Button>
          <Button 
            variant="outlined"
            onClick={() => {
              setSearchTerm('');
              setFilteredReservations(reservations);
            }}
            sx={{ height: 56 }}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Reservations Table */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Reservation List
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Reservation ID</TableCell>
                <TableCell>Guest FullName</TableCell>
                <TableCell>Room Type</TableCell>
                <TableCell>Check-In</TableCell>
                <TableCell>Check-Out</TableCell>
                <TableCell>Number of Guest</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReservations.length > 0 ? (
                filteredReservations.map((reservation) => (
                  <TableRow key={reservation.reservation_id}>
                    <TableCell>{reservation.reservation_id}</TableCell>
                    <TableCell>{reservation.guest_name}</TableCell>
                    <TableCell>{reservation.room_type}</TableCell>
                    <TableCell>{new Date(reservation.check_in_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(reservation.check_out_date).toLocaleDateString()}</TableCell>
                    <TableCell>{reservation.number_of_guests}</TableCell>
                    <TableCell>
                      <Box 
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: 
                            reservation.status === 'confirmed' ? 'success.light' :
                            reservation.status === 'pending' ? 'warning.light' :
                            'error.light',
                          color: 'common.white'
                        }}
                      >
                        {reservation.status}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {reservation.status !== 'confirmed' && (
                        <Button 
                          size="small" 
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleConfirmReservation(reservation.reservation_id)}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Confirm
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No reservations found
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

export default EmployeeDashboard;