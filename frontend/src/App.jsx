import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./register";
import Login from "./login";
import Guest from "./guest";
import Employee from "./employee";
import Admin from "./admin";
import Adminsales from "./admin-sales";
import Adminroom from "./admin-room";
import AdminRecords from "./admin-records";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/guest" element={<Guest />} />
        <Route path="/employee" element={<Employee />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/adminsales" element={<Adminsales />} />
        <Route path="/adminroom" element={<Adminroom />} />
        <Route path="/adminrecords" element={<AdminRecords/>}/>

      </Routes>
    </Router>
  );
}

export default App;
