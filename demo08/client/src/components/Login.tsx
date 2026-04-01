import React, { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Backdrop, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';

interface Props {
  setToken: Dispatch<SetStateAction<string>>;
}

const Login: React.FC<Props> = ({ setToken }: Props): React.ReactElement => {
  const navigate: NavigateFunction = useNavigate();
  const lomakeRef = useRef<HTMLFormElement>(null);

  const kirjaudu = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();
    const lomake = lomakeRef.current;
    if (!lomake) return;

    const kayttajatunnus = (lomake.elements.namedItem('kayttajatunnus') as HTMLInputElement).value;
    const salasana = (lomake.elements.namedItem('salasana') as HTMLInputElement).value;

    if (!kayttajatunnus || !salasana) return;

    const yhteys = await fetch('http://localhost:3008/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kayttajatunnus, salasana }),
    });

    if (yhteys.status === 200) {
      const { token } = await yhteys.json() as { token: string };
      setToken(token);
      localStorage.setItem('token', token);
      void navigate('/');
    }
  };

  return (
    <Backdrop open>
      <Paper sx={{ padding: 2 }}>
        <Box
          component="form"
          onSubmit={kirjaudu}
          ref={lomakeRef}
          sx={{ width: 300, padding: 2 }}
        >
          <Stack spacing={2}>
            <Typography variant="h6">Kirjaudu sisään</Typography>
            <TextField label="Käyttäjätunnus" name="kayttajatunnus" />
            <TextField label="Salasana" name="salasana" type="password" />
            <Button type="submit" variant="contained" size="large">
              Kirjaudu
            </Button>
            <Typography variant="body2">
              (Testitunnukset: käyttäjä: juuseri, salasana: passu123)
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Backdrop>
  );
};

export default Login;
