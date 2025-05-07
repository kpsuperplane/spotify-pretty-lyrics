import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import auth from './auth';

export default function SpotifyAuthHandler() {

  const navigate = useNavigate();

  useEffect(() => {
    auth.isReturningFromAuthServer().then((hasAuthCode) => {
      if (!hasAuthCode) {
        console.log("Something wrong...no auth code.");
      }
      return auth.getAccessToken().then((response) => {
        const token = response.token?.value ?? '';
        localStorage.setItem("token", token);
        api.setAccessToken(token);
      });
    }).finally(() => {
      navigate('/');
    });
  }, [navigate]);
  return null;
}