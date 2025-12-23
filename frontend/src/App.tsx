import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { setAuthToken } from './services/api';
import Login from './pages/Login';
import GroupDashboard from './pages/GroupDashboard';
import InventoryDetails from './pages/InventoryDetails';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';

import JournalLayout from './layouts/JournalLayout';
import Navbar from './components/Navbar';

function App() {
  const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();

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

  if (isLoading) return <div className="min-h-screen bg-neutral-900 text-gold flex items-center justify-center font-heading text-2xl">Opening your satchel...</div>;

  return (
    <BrowserRouter>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
            <ProtectedRoute component={() => (
                <JournalLayout>
                    <GroupDashboard />
                </JournalLayout>
            )} />
        } />
        <Route path="/group/:groupId" element={
            <ProtectedRoute component={() => (
                <JournalLayout>
                    <InventoryDetails />
                </JournalLayout>
            )} />
        } />
        <Route path="/chat" element={
            <ProtectedRoute component={() => (
                <JournalLayout>
                    <ChatPage />
                </JournalLayout>
            )} />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
