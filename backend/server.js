const express = require("express");
const mysql2 = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql2.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "hotel-web",
  waitForConnections: true,
  connectionLimit: 10,
});

db.getConnection((err) => {
  if (err) {
    console.log("Database Connection Failed", err);
  } else {
    console.log("Connected to MySQL database");
  }
});



//to fetch data from database users employee
app.get("/api/employee", (req, res) => {
  db.query(
    "SELECT * FROM users WHERE role = 'employee' ",
  
    (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ error: "Failed to fetch records" });
      }
      
      // Format the results before sending
      const records = results.map(user => ({
        id: user.user_id,
        username: user.username,
        contact: user.contact,
        fullname: user.fullname,
        role: user.role,
      }));
      
      res.json(records);
    }
  );
});

// to delete employee from database

app.delete("/api/employee/:id", (req, res) => {
  const employeeId = req.params.id;
  
  db.query(
    "DELETE FROM users WHERE user_id = ? AND role = 'employee'",
    [employeeId],
    (error, results) => {
      if (error) {
        console.error("Delete error:", error);
        return res.status(500).json({ error: "Failed to delete employee" });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      res.json({ message: "Employee deleted successfully" });
    }
  );
});


//fetch data from Room table
app.get("/api/rooms", (req, res) => {
  db.query(
    "SELECT room_id, room_type, price, maximum_cap FROM room_tbl",
    (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ error: "Failed to fetch rooms" });
      }
      res.json(results);
    }
  );
});

// Update room price
app.put("/api/rooms/:type", (req, res) => {
  const { type } = req.params;
  const { price } = req.body;

  // First validate the price is a positive number
  if (isNaN(price)) {
    return res.status(400).json({ error: "Price must be a number" });
  }
  if (price <= 0) {
    return res.status(400).json({ error: "Price must be positive" });
  }

  db.query(
    "UPDATE room_tbl SET price = ? WHERE room_type = ?",
    [price, type],
    (error, results) => {
      if (error) {
        console.error("Update error:", error);
        return res.status(500).json({ error: "Failed to update price" });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Room type not found" });
      }
      
      res.json({ 
        message: "Price updated successfully",
        room_type: type,
        new_price: price
      });
    }
  );
});


//register
app.post("/register", async (req, res) => {
  const { username, password, fullname, contact, role } = req.body;

  if (!username || !password || !fullname || !contact) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const checkUserSql = "SELECT * FROM users WHERE username = ?";

  db.query(checkUserSql, [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    if (results.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Determine role - use provided role if admin, otherwise default to 'guest'
    const userRole = role === 'employee' ? 'employee' : 'guest';
    
    const insertUserSql = "INSERT INTO users (username, password, fullname, contact, role) VALUES (?,?,?,?,?)";
    db.query(insertUserSql, 
      [username, hashedPassword, fullname, contact, userRole], 
      (err, result) => {
        if (err) return res.status(500).json({ message: "Registration Failed" });
        res.status(201).json({ 
          message: "User registered successfully",
          role: userRole 
        });
    });
  });
});

// Login User
app.post("/login", (req, res) => {
  const { username, password} = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login successful", token, username: user.username, role: user.role });
  });
});





// Add this to your backend (after your other routes)
// Create reservation (without payment)
app.post("/api/reservations", (req, res) => {
  const { checkIn, checkOut, guests, roomType, username } = req.body;

  if (!checkIn || !checkOut || !guests || !roomType) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Get room_id
  db.query(
    "SELECT room_id, price FROM room_tbl WHERE room_type = ?",
    [roomType],
    (error, results) => {
      if (error || results.length === 0) {
        return res.status(500).json({ error: "Failed to find room" });
      }

      const roomId = results[0].room_id;
      const roomPrice = results[0].price;

      // Get user_id
      db.query(
        "SELECT user_id FROM users WHERE username = ?",
        [username],
        (error, userResults) => {
          if (error || userResults.length === 0) {
            return res.status(500).json({ error: "User not found" });
          }

          const userId = userResults[0].user_id;

          // Create reservation
          db.query(
            "INSERT INTO reservation (check_in_date, check_out_date, number_of_guests, room_id, user_id) VALUES (?, ?, ?, ?, ?)",
            [checkIn, checkOut, guests, roomId, userId],
            (error, insertResults) => {
              if (error) {
                return res.status(500).json({ error: "Failed to create reservation" });
              }

              res.json({ 
                message: "Reservation created successfully",
                reservationId: insertResults.insertId,
                roomPrice: roomPrice
              });
            }
          );
        }
      );
    }
  );
});

// Create payment
app.post("/api/payments", (req, res) => {
  const { reservationId, amountPaid, paymentMethod } = req.body;

  if (!reservationId || !amountPaid || !paymentMethod) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.query(
    "INSERT INTO payment (reservation_id, amount_paid, payment_method) VALUES (?, ?, ?)",
    [reservationId, amountPaid, paymentMethod],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: "Failed to process payment" });
      }

      // Update reservation status to confirmed
      db.query(
        "UPDATE reservation SET status = 'pending' WHERE reservation_id = ?",
        [reservationId],
        (error, updateResults) => {
          if (error) {
            console.error("Failed to update reservation status:", error);
          }
          
          res.json({ 
            message: "Payment processed successfully",
            paymentId: results.insertId
          });
        }
      );
    }
  );
});


// Get all food items
app.get('/api/food', (req, res) => {
  db.query('SELECT * FROM food', (error, results) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json(results);
  });
});

// Get food items for a specific room
app.get('/api/rooms/:id/food', (req, res) => {
  const roomId = req.params.id;
  db.query(`
    SELECT f.* FROM food f
    JOIN room_food rf ON f.food_id = rf.food_id
    WHERE rf.room_id = ?
  `, [roomId], (error, results) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json(results);
  });
});

// Get all reservations
app.get('/api/reservations', (req, res) => {
  const sql = `
    SELECT r.*, u.fullname AS guest_name, rt.room_type 
    FROM reservation r
    JOIN users u ON r.user_id = u.user_id
    JOIN room_tbl rt ON r.room_id = rt.room_id
    ORDER BY r.check_in_date DESC
  `;
  
  db.query(sql, (error, results) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json(results);
  });
});

// Confirm reservation endpoint
app.put('/api/reservations/:id/confirm', (req, res) => {
  const reservationId = req.params.id;
  
  db.query(
    "UPDATE reservation SET status = 'confirmed' WHERE reservation_id = ?",
    [reservationId],
    (error, results) => {
      if (error) return res.status(500).json({ error: error.message });
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      res.json({ message: "Reservation confirmed successfully" });
    }
  );
});
















app.get("/api/payments",(req, res) => {
  const sql = `
    SELECT p.*, u.fullname AS guest_name, rt.room_type, r.status
    FROM payment p
    JOIN reservation r ON p.reservation_id = r.reservation_id
    JOIN users u ON r.user_id = u.user_id
    JOIN room_tbl rt ON r.room_id = rt.room_id
    ORDER BY p.payment_date DESC
  `;
  
  db.query(sql, (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to fetch payments" });
    }
    res.json(results);
  });
});

app.get("/api/payments/:year/:month", (req, res) => {
  const { year, month } = req.params;
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = `${year}-${month.padStart(2, '0')}-31`;
  
  const sql = `
    SELECT p.*, u.fullname AS guest_name, rt.room_type, r.status
    FROM payment p
    JOIN reservation r ON p.reservation_id = r.reservation_id
    JOIN users u ON r.user_id = u.user_id
    JOIN room_tbl rt ON r.room_id = rt.room_id
    WHERE p.payment_date BETWEEN ? AND ?
    ORDER BY p.payment_date DESC
  `;
  
  db.query(sql, [startDate, endDate], (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to fetch payments" });
    }
    res.json(results);
  });
});

app.get("/api/payments/summary", (req, res) => {
  const { month, year } = req.query;
  
  let sql = `
    SELECT 
      COUNT(*) AS total_payments,
      SUM(amount_paid) AS total_revenue,
      (SELECT COUNT(*) FROM reservation WHERE 
        ${month && year ? 
          `YEAR(check_in_date) = ${year} AND MONTH(check_in_date) = ${month}` 
          : '1=1'
      }) AS total_reservations,
      (SELECT COUNT(*) FROM reservation WHERE status = 'confirmed' AND
        ${month && year ? 
          `YEAR(check_in_date) = ${year} AND MONTH(check_in_date) = ${month}` 
          : '1=1'
      }) AS confirmed_reservations,
      (SELECT COUNT(*) FROM reservation WHERE status = 'pending' AND
        ${month && year ? 
          `YEAR(check_in_date) = ${year} AND MONTH(check_in_date) = ${month}` 
          : '1=1'
      }) AS pending_reservations
    FROM payment
    ${month && year ? 
      `WHERE YEAR(payment_date) = ${year} AND MONTH(payment_date) = ${month}` 
      : ''
    }
  `;
  
  db.query(sql, (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to fetch payment summary" });
    }
    res.json(results[0] || {
      total_payments: 0,
      total_revenue: 0,
      total_reservations: 0,
      confirmed_reservations: 0,
      pending_reservations: 0
    });
  });
});







app.listen(5000, () => {  
  console.log("Server running on port 5000");
});
