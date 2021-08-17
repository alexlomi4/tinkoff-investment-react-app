import '../App.css';
import React, {
  ChangeEvent, useCallback, useEffect, useRef, useState,
} from 'react';
import LoadingWrapper from '../generic/components/LoadingWrapper';

type Props = {
  onLogin: (token: string) => any;
};

export const TOKEN = 'auth_token';

const TOKEN_TIME = 'token_TIME';
const MS_IN_SEC = 1e3;
const SEC_IN_MIN = 60;
const TOKEN_TTL_SEC = MS_IN_SEC * SEC_IN_MIN * 15;

type TokenCallback = (token: string) => void;

function useAuthToken(onLogin: (token: string) => unknown): [boolean, string, TokenCallback] {
  const [tokenRestoring, setTokenRestoring] = useState(true);

  const oldTokenRef = useRef(localStorage.getItem(TOKEN) || '');
  const sessionExpired = Date.now() - Number(localStorage.getItem(TOKEN_TIME)) > TOKEN_TTL_SEC;
  const isOldTokenValidRef = useRef(oldTokenRef.current && !sessionExpired);
  const [token, setToken] = useState(!isOldTokenValidRef.current ? '' : oldTokenRef.current);
  useEffect(() => {
    if (isOldTokenValidRef.current) {
      onLogin(oldTokenRef.current);
    }
    setTokenRestoring(false);
  }, [onLogin, oldTokenRef]);

  const onNewToken = useCallback<TokenCallback>((newToken) => {
    localStorage.setItem(TOKEN, newToken);
    localStorage.setItem(TOKEN_TIME, String(new Date().getTime()));
    setToken(newToken);
  }, []);

  return [tokenRestoring, token, onNewToken];
}

function LoginForm({
  onLogin,
}: Props) {
  const [tokenRestoring, token, onNewToken] = useAuthToken(onLogin);
  const onTokenChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    onNewToken(event.target.value);
  }, [onNewToken]);
  const onLoginPress = useCallback(() => {
    onLogin(token);
  }, [token, onLogin]);

  return (
    <LoadingWrapper loading={tokenRestoring} loadingError={false}>
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
    </LoadingWrapper>
  );
}

export default LoginForm;
