import React, { createContext, useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { IUser } from '../interfaces/IUser';

interface IAuthState {
  accessToken: string | null;
  authenticated: boolean;
}

interface ILoginResponse {
  data: {
    token: string,
    user: IUser
  }
}

const useValue = (baseUrl: string) => {
  const [authState, setAuthState] = useState<IAuthState>({
    accessToken: null,
    authenticated: false,
  });
  const [user, setUser] = useState<IUser>({
    created_at: null,
    email: null,
    emailVerifiedAt: null,
    id: null,
    name: null,
    remember_token: null,
    updated_at: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [wrongCredsError, setWrongCredsError] = useState(false);

  const privateRoute = (element: JSX.Element) => {
    if (authState.authenticated) {
      return (element);
    }
    return (<Navigate to="/" />);
  };

  const fakeLogin = (creds: FormData, action?: () => void) => {
    setUser({
      created_at: '',
      email: 'test@example.com',
      emailVerifiedAt: '',
      id: 0,
      name: 'Jason',
      remember_token: '',
      updated_at: '',
    });
    setAuthState({
      accessToken: 'accessToken',
      authenticated: true,
    });
    setIsLoading(false);
    setWrongCredsError(false);
    action;
  };

  const login = async (creds: FormData, action?: () => void): Promise<void> => {
    setIsLoading(true);
    axios.defaults.withCredentials = true;
    await axios.get(
      `${baseUrl}/sanctum/csrf-cookie`,
      { headers: { 'ngrok-skip-browser-warning': 'value' } },
    )
      .then(() => {
        axios.post<ILoginResponse>(`${baseUrl}/externalLogin`, {
          email: creds.get('email'),
          password: creds.get('password'),
        }, { headers: { 'ngrok-skip-browser-warning': 'value' } })
          .then((responseLogin) => {
            setUser(responseLogin.data.data.user);
            setAuthState({
              accessToken: responseLogin.data.data.token,
              authenticated: true,
            });
            setIsLoading(false);
            setWrongCredsError(false);
            action;
          })
          .catch((error) => { setWrongCredsError(true); setIsLoading(false); });
      })
      .catch((error) => { console.log('cookie error', error); setIsLoading(false); });
  };

  const logout = () => {
    setAuthState({
      accessToken: null,
      authenticated: false,
    });
  };

  return {
    authState,
    user,
    isLoading,
    wrongCredsError,
    privateRoute,
    login,
    logout,
  };
};

const AuthContext = createContext({} as ReturnType<typeof useValue>);
const { Provider } = AuthContext;

interface AuthProviderProps extends React.HTMLProps<HTMLDivElement> {
  baseUrl: string
}

const AuthProvider: React.FC<AuthProviderProps> = ({
  children, baseUrl
}) => (
  <Provider value={useValue(baseUrl)}>
    {children}
  </Provider>
);
export { AuthContext, AuthProvider };
