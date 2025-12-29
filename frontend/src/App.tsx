import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Discovery from './pages/Discovery';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/discovery"
            element={
              <ProtectedRoute>
                <Discovery />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <Matches />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/chat/:conversationId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/discovery" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

