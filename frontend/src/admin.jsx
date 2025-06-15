import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, Box, Paper, Grid } from "@mui/material";

const admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [role, setRole] = useState("");


  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    if (storedUser && storedRole) {
      setUser(storedUser);
      setRole(storedRole);

    if (storedRole !== "admin") {
        navigate("/")
      }
    } else {
      navigate("/");
    }
  }, [navigate]);


  return (
    <Container maxWidth="lg">
      {/* Header with welcome message and logout */}
      <Box 
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          pt: 2
        }}
      >
        <Typography variant="h4">Welcome {user} {role}</Typography>
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

      {/* Admin Dashboard Form */}
      <Paper 
        elevation={3} 
        sx={{
          p: 4,
          borderRadius: 2,
          maxWidth: '900px',  // Added to constrain width
          margin: '0 auto'    // Added to center horizontally
        }}
      >
        <Typography 
          variant="h4" 
          component="h2" 
          align="center" 
          gutterBottom
          sx={{ mb: 4 }}
        >
          Admin Dashboard
        </Typography>

        <Grid 
          container 
          spacing={3}
          justifyContent="center"  // Added to center the buttons
        >
          <Grid item xs={12} sm={6} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ py: 2 }}
              onClick={() => navigate('/adminsales')}
            >
              SHOW SALES
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              size="large"
              sx={{ py: 2 }}
              onClick={() => navigate('/adminroom')}
            >
              SHOW ROOM DETAILS
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="warning"
              size="large"
              sx={{ py: 2 }}
              onClick={() => navigate('/adminrecords')}
            >
              SHOW RECORDS
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};



export default admin;
