import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Button,
  TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdminRecords = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    contact: '',
    username: '',
    fullname: '',
    password: '',
    role: 'employee' // Explicit role for admin-created users
  });
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("http://localhost:5000/api/employee");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/employee/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error("Failed to delete employee");
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = async () => {
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newEmployee,
          role: 'employee' // Force employee role for admin-created users
        }),
      });

      if (!response.ok) throw new Error("Failed to add employee");
      
      setNewEmployee({
        contact: '',
        username: '',
        fullname: '',
        password: '',
        role: 'employee' // Reset form with employee role
      });
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => navigate("/admin")}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Typography variant="h4" gutterBottom align="center">
        Admin Records
      </Typography>

      {error && (
        <Box sx={{ color: 'error.main', p: 2, mb: 2, border: '1px solid', borderColor: 'error.main' }}>
          Error: {error}
        </Box>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Contact No.</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.id}</TableCell>
                  <TableCell>{employee.contact}</TableCell>
                  <TableCell>{employee.username}</TableCell>
                  <TableCell>{employee.fullname}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>
                    <Button 
                      variant="contained" 
                      color="error" 
                      onClick={() => handleDelete(employee.id)}
                    >
                      DELETE
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {/* Add new employee row */}
              <TableRow>
                <TableCell>NEW</TableCell>
                <TableCell>
                  <TextField
                    name="contact"
                    placeholder='Contact'
                    value={newEmployee.contact}
                    onChange={handleInputChange}
                    size="small"
                    fullWidth
                    required
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name="username"
                    placeholder='Username'
                    value={newEmployee.username}
                    onChange={handleInputChange}
                    size="small"
                    fullWidth
                    required
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name="fullname"
                    placeholder='Fullname'
                    value={newEmployee.fullname}
                    onChange={handleInputChange}
                    size="small"
                    fullWidth
                    required
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={newEmployee.password}
                    onChange={handleInputChange}
                    size="small"
                    fullWidth
                    required
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleAddEmployee}
                    disabled={!newEmployee.contact || !newEmployee.username || !newEmployee.fullname || !newEmployee.password}
                    sx={{ mb: 1 }}
                  >
                    ADD EMPLOYEE
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default AdminRecords;