import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

// Custom hook to use auth context
const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;