import { useEffect, useState } from "react";
import Roomdetails from "./admin-room"
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  TextField,
  MenuItem,
  Paper,
  Stack,
  Alert,
  Box,
  Avatar,
  Modal,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Person as PersonIcon, Logout as LogoutIcon } from '@mui/icons-material';

const GuestDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [role, setRole] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [formData, setFormData] = useState({
    checkIn: null,
    checkOut: null,
    roomType: '',
    guests: 1,
  });

  const [availableRooms, setAvailableRooms] = useState([]);
  const [capacityError, setCapacityError] = useState('');

  // Modal states
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentReservationData, setCurrentReservationData] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: ''
  });

  const paymentMethods = [
    'Credit Card',
    'Debit Card',
    'PayPal',
    'Gcash'
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    if (storedUser && storedRole) {
      setUser(storedUser);
      setRole(storedRole);

      if (storedRole !== "guest") {
        navigate("/employee");
      }
    } else {
      navigate("/");
    }

    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/rooms", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error("Failed to fetch rooms");
        
        const data = await response.json();
        setRooms(data);
        setAvailableRooms(data);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [navigate]);

  // Filter rooms based on guest count
  useEffect(() => {
    if (!rooms.length) return;
    
    const guestCount = Number(formData.guests);
    
    if (guestCount > 6) {
      setAvailableRooms([]);
      setCapacityError('No rooms available for more than 6 guests');
      setFormData(prev => ({ ...prev, roomType: '' }));
    } else {
      setCapacityError('');
      const filtered = rooms.filter(room => room.maximum_cap >= guestCount);
      setAvailableRooms(filtered);
      
      if (formData.roomType && !filtered.some(room => room.room_type === formData.roomType)) {
        setFormData(prev => ({ ...prev, roomType: '' }));
      }
      
      if (filtered.length === 1 && !formData.roomType) {
        setFormData(prev => ({ ...prev, roomType: filtered[0].room_type }));
      }
    }
  }, [formData.guests, rooms, formData.roomType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'roomType' && value === "") {
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  const calculateTotalPrice = () => {
    if (!formData.checkIn || !formData.checkOut || !formData.roomType) return 0;
    
    const selectedRoom = rooms.find(room => room.room_type === formData.roomType);
    if (!selectedRoom) return 0;
    
    const diffTime = Math.abs(new Date(formData.checkOut) - new Date(formData.checkIn));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return selectedRoom.price * diffDays;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.guests > 6) {
      alert('No rooms available for this number of guests');
      return;
    }
    
    if (!formData.roomType) {
      alert('Please select a room type');
      return;
    }

    if (!formData.checkIn || !formData.checkOut) {
      alert('Please select both check-in and check-out dates');
      return;
    }

    // Calculate total price
    const totalPrice = calculateTotalPrice();
    
    // Save form data for confirmation
    setCurrentReservationData({
      formData: { ...formData },
      totalPrice: totalPrice,
      nights: Math.ceil(
        Math.abs(new Date(formData.checkOut) - new Date(formData.checkIn)) / 
        (1000 * 60 * 60 * 24)
      )
    });
    setConfirmationModalOpen(true);
  };

  const handleConfirmationEdit = () => {
    setConfirmationModalOpen(false);
  };

  const handleConfirmationProceed = () => {
    setConfirmationModalOpen(false);
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      
      // 1. First create the reservation
      const reservationResponse = await fetch("http://localhost:5000/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          checkIn: currentReservationData.formData.checkIn.toISOString().split('T')[0],
          checkOut: currentReservationData.formData.checkOut.toISOString().split('T')[0],
          guests: currentReservationData.formData.guests,
          roomType: currentReservationData.formData.roomType,
          username: user
        })
      });

      const reservationData = await reservationResponse.json();
      
      if (!reservationResponse.ok) {
        throw new Error(reservationData.error || "Failed to create reservation");
      }

      // 2. Then process the payment
      const paymentResponse = await fetch("http://localhost:5000/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          reservationId: reservationData.reservationId,
          amountPaid: currentReservationData.totalPrice,
          paymentMethod: paymentData.paymentMethod
        })
      });

      const paymentResult = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        throw new Error(paymentResult.error || "Failed to process payment");
      }

      alert("Payment and reservation processed successfully! Your reservation is pending confirmation.");
      setPaymentModalOpen(false);
      
      // Reset forms
      setFormData({
        checkIn: null,
        checkOut: null,
        roomType: '',
        guests: 1,
      });
      setPaymentData({
        amount: '',
        paymentMethod: ''
      });
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/");
  };

  if (loadingRooms) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
            <PersonIcon />
          </Avatar>
          <Typography variant="h5">Welcome, {user} ({role})</Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      <Roomdetails 
        showUpdateButton={false}
        gridProps={{
          spacing: 2,
          sx: { 
            flexWrap: 'nowrap',
            overflowX: 'auto',
            py: 1
          }
        }}
        cardProps={{ sx: { minWidth: 250 } }}
      />

      {/* Reservation Form */}
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Reservation
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Check-in / Check-out */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Check-in Date"
                value={formData.checkIn}
                onChange={(date) => handleDateChange('checkIn', date)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth required />
                )}
              />
              <DatePicker
                label="Check-out Date"
                value={formData.checkOut}
                onChange={(date) => handleDateChange('checkOut', date)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth required />
                )}
              />
            </LocalizationProvider>

            {/* Number of Guests Input */}
            <TextField
              type="number"
              label="Number of Guests"
              name="guests"
              value={formData.guests}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ min: 1, max: 10 }}
            />

            {/* Room Type Dropdown */}
            <TextField
              select
              label="Room Type"
              name="roomType"
              value={formData.roomType}
              onChange={handleChange}
              fullWidth
              required
              disabled={availableRooms.length === 0}
            >
              {availableRooms.length === 0 ? (
                <MenuItem disabled value="">
                  No available rooms for {formData.guests} guests
                </MenuItem>
              ) : (
                availableRooms.map((room) => (
                  <MenuItem key={room.room_type} value={room.room_type}>
                    {room.room_type} (Max: {room.maximum_cap}, ${room.price}/night)
                  </MenuItem>
                ))
              )}
            </TextField>

            {capacityError && (
              <Alert severity="error">{capacityError}</Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 2, py: 1.5 }}
              disabled={availableRooms.length === 0 || !formData.roomType}
            >
              Book Now
            </Button>
          </Stack>
        </form>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Your Reservation</DialogTitle>
        <DialogContent>
          {currentReservationData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Please review your reservation details:
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Room Type" 
                    secondary={currentReservationData.formData.roomType} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Check-In Date" 
                    secondary={new Date(currentReservationData.formData.checkIn).toLocaleDateString()} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Check-Out Date" 
                    secondary={new Date(currentReservationData.formData.checkOut).toLocaleDateString()} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Number of Nights" 
                    secondary={currentReservationData.nights} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Number of Guests" 
                    secondary={currentReservationData.formData.guests} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Total Price" 
                    secondary={`$${currentReservationData.totalPrice}`}
                    secondaryTypographyProps={{ variant: "h6" }}
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmationEdit} color="secondary">
            Back to Edit
          </Button>
          <Button 
            onClick={handleConfirmationProceed} 
            variant="contained" 
            color="primary"
          >
            Proceed to Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        aria-labelledby="payment-modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <Typography id="payment-modal-title" variant="h6" component="h2" gutterBottom>
            Payment Summary
          </Typography>
          
          {currentReservationData && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Room Type:</strong> {currentReservationData.formData.roomType}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Check-In:</strong> {new Date(currentReservationData.formData.checkIn).toLocaleDateString()}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Check-Out:</strong> {new Date(currentReservationData.formData.checkOut).toLocaleDateString()}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Nights:</strong> {currentReservationData.nights}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Guests:</strong> {currentReservationData.formData.guests}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  <strong>Total Price:</strong> ${currentReservationData.totalPrice}
                </Typography>
              </Box>
              
              <form onSubmit={handlePaymentSubmit}>
                <Stack spacing={2}>
                  <TextField
                    type="number"
                    label="Amount to Pay"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    fullWidth
                    required
                    inputProps={{ 
                      min: currentReservationData.totalPrice,
                      max: currentReservationData.totalPrice
                    }}
                  />
                  
                  <TextField
                    select
                    label="Payment Method"
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                    fullWidth
                    required
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                  >
                    Complete Payment
                  </Button>
                </Stack>
              </form>
            </>
          )}
        </Box>
      </Modal>
    </Container>
  );
};

export default GuestDashboard;