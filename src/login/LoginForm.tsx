import '../App.css';
import React, { useCallback, useState } from 'react';

type Props = {
  onLogin: (token: string) => any;
};

function LoginForm({
  onLogin,
}: Props) {
  const [token, setToken] = useState('');
  const onTokenChange = useCallback((event) => {
    setToken(event.target.value);
  }, []);
  const onLoginPress = useCallback(() => {
    onLogin(token);
  }, [token, onLogin]);

  return (
    <div className="Log-in-panel">
      <pre className="Log-in-text">
        Input token
      </pre>
      <textarea
        className="Log-in-input"
        required
        placeholder="token"
        onInput={onTokenChange}
      />
      <button
        className="Log-in-button"
        type="button"
        onClick={onLoginPress}
        disabled={!token}
      >
        Log in
      </button>
    </div>
  );
}

export default LoginForm;
