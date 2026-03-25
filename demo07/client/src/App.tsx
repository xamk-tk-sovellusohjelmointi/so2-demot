import React, { useEffect, useRef, useState } from 'react';
import { Alert, Backdrop, Button, CircularProgress, Container, IconButton, List, ListItem, ListItemText, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

// Token, joka on generoitu luoJWT.js-ohjelmalla palvelimen salaisella avaimella.
// Oikeassa sovelluksessa token tulisi palvelimelta kirjautumisen jälkeen, ei koodiin kovakoodattuna.
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDIyMDMzNDh9.0OqTw4sohQE6UdVF8nRAAiMOwNK95mSwPOCbdgLjmgo';

interface Ostos {
  id: number
  tuote: string
  poimittu: boolean
}

interface ApiData {
  ostokset: Ostos[]
  virhe: string
  haettu: boolean
}

const App: React.FC = (): React.ReactElement => {
  const lomakeRef = useRef<HTMLFormElement>(null);
  const [apiData, setApiData] = useState<ApiData>({
    ostokset: [],
    virhe: '',
    haettu: false,
  });

  const poistaTuote = (ostos: Ostos): void => {
    apiKutsu('DELETE', undefined, ostos.id);
  };

  const lisaaTuote = (e: React.FormEvent): void => {
    e.preventDefault();
    const lomake = lomakeRef.current;
    if (!lomake) return;
    const uusiTuote = (lomake.elements.namedItem('uusiTuote') as HTMLInputElement).value;
    apiKutsu('POST', { id: 0, tuote: uusiTuote, poimittu: false });
  };

  const apiKutsu = async (metodi?: string, ostos?: Ostos, id?: number): Promise<void> => {
    setApiData((prev) => ({ ...prev, haettu: false }));

    const url = id ? `http://localhost:3007/api/ostokset/${id}` : 'http://localhost:3007/api/ostokset';

    // Authorization-header lähetetään mukana jokaisessa pyynnössä
    let asetukset: RequestInit = {
      method: metodi ?? 'GET',
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    };

    if (metodi === 'POST') {
      asetukset = {
        ...asetukset,
        headers: {
          ...(asetukset.headers as Record<string, string>),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ostos),
      };
    }

    try {
      const yhteys = await fetch(url, asetukset);

      if (yhteys.status === 200 || yhteys.status === 201) {
        const data: Ostos[] = await yhteys.json() as Ostos[];
        setApiData({ ostokset: data, virhe: '', haettu: true });
      } else {
        let virheteksti: string;
        switch (yhteys.status) {
          case 400: virheteksti = 'Virhe pyynnön tiedoissa'; break;
          case 401: virheteksti = 'Virheellinen token'; break;
          default: virheteksti = 'Palvelimella tapahtui odottamaton virhe'; break;
        }
        setApiData((prev) => ({ ...prev, virhe: virheteksti, haettu: true }));
      }
    } catch {
      setApiData((prev) => ({ ...prev, virhe: 'Palvelimeen ei saada yhteyttä', haettu: true }));
    }
  };

  useEffect(() => {
    void apiKutsu();
  }, []);

  return (
    <Container>
      <Typography variant="h5">Demo 7: JWT-autorisointi</Typography>
      <Typography variant="h6" sx={{ marginBottom: 2, marginTop: 2 }}>Ostoslista</Typography>

      {apiData.virhe
        ? <Alert severity="error">{apiData.virhe}</Alert>
        : apiData.haettu
          ? <Stack component="form" onSubmit={lisaaTuote} ref={lomakeRef} spacing={2}>
              <List>
                {apiData.ostokset.map((ostos: Ostos, idx: number) => (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => { poistaTuote(ostos); }}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={ostos.tuote} />
                  </ListItem>
                ))}
              </List>

              <TextField
                name="uusiTuote"
                fullWidth
                placeholder="Kirjoita tähän uusi tuote..."
              />

              <Button type="submit" variant="contained" size="large" fullWidth>
                Lisää tuote ostoslistaan
              </Button>
            </Stack>
          : <Backdrop open>
              <CircularProgress color="inherit" />
            </Backdrop>
      }
    </Container>
  );
};

export default App;
