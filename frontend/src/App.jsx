import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import AssignmentList from './pages/AssignmentList/AssignmentList';
import AssignmentAttempt from './pages/AssignmentAttempt/AssignmentAttempt';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageAssignments from './pages/Admin/ManageAssignments';
import AssignmentForm from './pages/Admin/AssignmentForm';
import ManageTables from './pages/Admin/ManageTables';
import Profile from './pages/Profile/Profile';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Bookmarks from './pages/Bookmarks/Bookmarks';
import History from './pages/History/History';
import Sandbox from './pages/Sandbox/Sandbox';

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
          {/* User routes */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/history" element={<History />} />
          <Route path="/sandbox" element={<Sandbox />} />
          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/assignments" element={<ManageAssignments />} />
          <Route path="/admin/assignments/new" element={<AssignmentForm />} />
          <Route path="/admin/assignments/edit/:id" element={<AssignmentForm />} />
          <Route path="/admin/tables" element={<ManageTables />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
