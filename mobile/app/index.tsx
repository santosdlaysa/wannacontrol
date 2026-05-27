import { Redirect } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';

export default function Index() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/mesas" />;
  }

  return <Redirect href="/login" />;
}
