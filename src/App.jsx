import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import FeePayment from "./pages/FeePayment";
import TimetableManager from "./pages/TimetableManager";
import ClassManager from "./pages/ClassManager";
import Attendance from "./pages/Attendance";
import ReceiptViewer from "./pages/ReceiptViewer";
import FeeManagement from "./pages/FeeManagement";
import StudentTimetable from "./pages/StudentTimetable";
import Profile from "./pages/Profile";
import AdminRegister from "./pages/AdminRegister";
import InitialAdminRegister from "./pages/InitialAdminRegister";
import UserManagement from "./pages/UserManagement";
import StaffTimetable from "./pages/StaffTimetable";
import Assignments from "./pages/Assignments";
import Grades from "./pages/Grades";
import Reports from "./pages/Reports";
import StaffProfile from "./pages/StaffProfile";
import StudentAssignments from "./pages/StudentAssignments";

// Protected Route component
function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/initial-admin" element={<InitialAdminRegister />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Admin Routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ClassManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <TimetableManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fee-management"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <FeeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/register"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminRegister />
              </ProtectedRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff/timetable"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/attendance"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/assignments"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <Assignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/grades"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <Grades />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/reports"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/profile"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffProfile />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student-timetable"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/fee-payment"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <FeePayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/receipts"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <ReceiptViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
