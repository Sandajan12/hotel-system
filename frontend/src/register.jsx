import { useState } from "react";
import axios from "axios";
import { TextField, Button, Container, Typography } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";



const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [contact, setContact] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !password || !contact || !fullname) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/register", { username, password, fullname, contact }, { headers: { "Content-Type": "application/json" } });

      alert(response.data.message);
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <Container maxWidth="xs">
      <Typography variant="h4">Register</Typography>
      <TextField label="Fullname" fullWidth margin="normal" value={fullname} onChange={(e) => setFullname(e.target.value)} />
      <TextField label="Contact NO." fullWidth margin="normal" type="contact" value={contact} onChange={(e) => setContact(e.target.value)} />
      <TextField label="Username" fullWidth margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} />
      <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button variant="contained" color="primary" fullWidth onClick={handleRegister}>
        Register
      </Button>
      <Typography>------------------------------ or -------------------------------------</Typography>
        <Typography>Already have an account? <Link to="/">Sign In</Link> </Typography>
    </Container>
  );
};

export default Register;
