import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import AssignmentList from './pages/AssignmentList/AssignmentList';
import AssignmentAttempt from './pages/AssignmentAttempt/AssignmentAttempt';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageAssignments from './pages/Admin/ManageAssignments';
import AssignmentForm from './pages/Admin/AssignmentForm';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<AssignmentList />} />
          <Route path="/assignment/:id" element={<AssignmentAttempt />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/assignments" element={<ManageAssignments />} />
          <Route path="/admin/assignments/new" element={<AssignmentForm />} />
          <Route path="/admin/assignments/edit/:id" element={<AssignmentForm />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
