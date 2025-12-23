import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { setAuthToken } from './services/api';
import Login from './pages/Login';
import GroupDashboard from './pages/GroupDashboard';
import InventoryDetails from './pages/InventoryDetails';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    const getToken = async () => {
      try {
        if (isAuthenticated) {
          const token = await getAccessTokenSilently();
          setAuthToken(token);
        }
      } catch (error) {
        console.error("Error getting token", error);
      }
    };
    getToken();
  }, [getAccessTokenSilently, isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute component={GroupDashboard} />} />
        <Route path="/group/:groupId" element={<ProtectedRoute component={InventoryDetails} />} />
        <Route path="/chat" element={<ProtectedRoute component={ChatPage} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
