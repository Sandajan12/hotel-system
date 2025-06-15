import { useState } from "react";
import axios from "axios";
import { Container,
  Typography,
  TextField,
  Button,
  Box,
  Divider } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";



const Login = () =>{
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

// EVENT HANDLEr for  LOGIN

    const handleLogin = async () => {
        if (!username || !password) {
          alert("Please fill in all fields");
          return;
        }
    
        try {
          const response = await axios.post("http://localhost:5000/login", { username, password }, { headers: { "Content-Type": "application/json" } });
    
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("username", response.data.username); // Store username
          localStorage.setItem("role", response.data.role);
          alert("Login successful!");
          navigate("/guest");
        } catch (error) {
          alert(error.response?.data?.message || "Invalid credentials");
        }
      };

// 

return (
    <Container maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh', // Centers vertically in the viewport
          gap: 2, // Adds consistent spacing between elements
          textAlign: 'center' // Centers text elements
        }}
      >
        {/* Login Title */}
        <Typography variant="h4" gutterBottom>Login</Typography>
        
        {/* Username Field */}
        <TextField 
          label="Username" 
          fullWidth 
          margin="normal" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
        />
        
        {/* Password Field */}
        <TextField 
          label="Password" 
          type="password" 
          fullWidth 
          margin="normal" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        
        {/* Login Button */}
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          onClick={handleLogin}
          sx={{ mt: 2 }}
        >
          LOGIN
        </Button>
        
        {/* Divider with "or" */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          my: 2 
        }}>
          <Divider sx={{ flexGrow: 1 }} />
          <Typography variant="body1" sx={{ px: 2 }}>or</Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box>
        
        {/* Sign Up Link */}
        <Typography>
          Don't have an account?{' '}
          <Link to="/register" style={{ textDecoration: 'none' }}>
            Sign Up
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;


