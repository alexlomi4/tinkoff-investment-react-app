import './App.css';
import React, { useCallback, useState } from 'react';
import Dashboard from './dashboard/Dashboard';
import LoginForm from './login/LoginForm';
import {InvestApiService} from './service';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const onLogIn = useCallback((token) => {
    InvestApiService.setToken(token);
    setLoggedIn(true);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        {loggedIn && (
          <Dashboard />
        )}
        {!loggedIn && (
          <LoginForm
            onLogin={onLogIn}
          />
        )}
      </header>
    </div>
  );
}

export default App;
