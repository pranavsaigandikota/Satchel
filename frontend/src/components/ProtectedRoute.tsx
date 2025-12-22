import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    component: React.ComponentType<any>;
    [key: string]: any;
}

const ProtectedRoute = ({ component: Component, ...args }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth0();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? (
        <Component {...args} />
    ) : (
        <Navigate to="/" />
    );
};

export default ProtectedRoute;
