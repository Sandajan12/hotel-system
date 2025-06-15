import React, { useState, useEffect } from 'react';
import { 
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  TextField,
  Button,
  Box,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import deluxeroom from './assets/deluxe-room.webp';
import executiveroom from './assets/executive-room.jpg';
import familyroom from './assets/family-room.jpeg';
import standardroom from './assets/standard-room.jpg';
import { useNavigate } from 'react-router-dom';

const Adminroom = ({ showUpdateButton = true }) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tempPrices, setTempPrices] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rooms
        const roomsResponse = await fetch("http://localhost:5000/api/rooms");
        if (!roomsResponse.ok) throw new Error("Failed to fetch rooms");
        const roomsData = await roomsResponse.json();

        // Fetch all food items
        const foodResponse = await fetch("http://localhost:5000/api/food");
        if (!foodResponse.ok) throw new Error("Failed to fetch food items");
        const foodData = await foodResponse.json();
        setFoodItems(foodData);

        // Fetch food for each room
        const roomsWithFood = await Promise.all(roomsData.map(async (room) => {
          const foodForRoom = await fetch(`http://localhost:5000/api/rooms/${room.room_id}/food`);
          const foodData = await foodForRoom.json();
          return { ...room, food: foodData };
        }));

        setRooms(roomsWithFood);
        
        const initialTempPrices = {};
        roomsData.forEach(room => {
          initialTempPrices[room.room_id] = room.price;
        });
        setTempPrices(initialTempPrices);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRoomImage = (roomType) => {
    switch(roomType.toLowerCase()) {
      case 'deluxe room': return deluxeroom;
      case 'executive room': return executiveroom;
      case 'family room': return familyroom;
      case 'standard room': return standardroom;
      default: return standardroom;
    }
  };

  const getFoodTypes = (foodItems) => {
    const types = {};
    foodItems.forEach(item => {
      if (!types[item.food_type]) {
        types[item.food_type] = [];
      }
      types[item.food_type].push(item.food_name);
    });
    return types;
  };

  const handleEdit = (room_id, currentPrice) => {
    setEditingId(room_id);
    setTempPrices(prev => ({
      ...prev,
      [room_id]: currentPrice
    }));
  };

  const handlePriceChange = (room_id, value) => {
    setTempPrices(prev => ({
      ...prev,
      [room_id]: value
    }));
  };

  const handleSave = async (room_id, room_type) => {
    try {
      const newPrice = Number(tempPrices[room_id]);
      
      if (isNaN(newPrice) || newPrice <= 0) {
        throw new Error("Price must be a positive number");
      }

      const response = await fetch(`http://localhost:5000/api/rooms/${room_type}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: newPrice })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update price");
      }

      setRooms(rooms.map(room => 
        room.room_id === room_id ? { ...room, price: newPrice } : room
      ));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };  

  const handleCancel = (room_id) => {
    setTempPrices(prev => ({
      ...prev,
      [room_id]: rooms.find(room => room.room_id === room_id).price
    }));
    setEditingId(null);
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
      {showUpdateButton && (
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate("/admin")}
        >
          BACK
        </Button>
      )}
      
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Room Details
      </Typography>

      <Grid container spacing={4}>
        {rooms.map((room) => {
          const foodTypes = getFoodTypes(room.food || []);
          
          return (
            <Grid item xs={12} sm={6} md={3} key={room.room_id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={getRoomImage(room.room_type)}
                  alt={room.room_type}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {room.room_type}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Max Capacity: {room.maximum_cap}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Included Meals:
                  </Typography>
                  
                  <List dense sx={{ mb: 2 }}>
                    {Object.entries(foodTypes).map(([type, items]) => (
                      <ListItem key={type} disablePadding>
                        <ListItemText
                          primary={`${type.charAt(0).toUpperCase() + type.slice(1)}:`}
                          secondary={items.join(', ')}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  {editingId === room.room_id ? (
                    <>
                      <TextField
                        fullWidth
                        label="Room Price"
                        type="number"
                        value={tempPrices[room.room_id] || ''}
                        onChange={(e) => handlePriceChange(room.room_id, e.target.value)}
                        sx={{ mb: 2 }}
                        inputProps={{ min: 1 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          size="small"
                          onClick={() => handleSave(room.room_id, room.room_type)}
                        >
                          Save
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="secondary" 
                          size="small"
                          onClick={() => handleCancel(room.room_id)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" color="text.secondary">
                        ${room.price} per night
                      </Typography>
                      {showUpdateButton && (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          sx={{ mt: 2 }}
                          onClick={() => handleEdit(room.room_id, room.price)}
                        >
                          Update Price
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default Adminroom;