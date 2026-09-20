import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState, type SubmitEvent } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import CssBaseline from "@mui/material/CssBaseline";

interface Ostos {
  id: number;
  tuote: string;
  poimittu: boolean;
}

interface ApiData {
  ostokset: Ostos[];
  virhe: string;
  haettu: boolean;
}

type Metodi = "GET" | "POST" | "PUT" | "DELETE";

const API_URL = "http://localhost:3006/api/ostokset";

const App = () => {
  const [uusiTuote, setUusiTuote] = useState<string>("");

  const [apiData, setApiData] = useState<ApiData>({
    ostokset: [],
    virhe: "",
    haettu: false,
  });

  const poistaTuote = (ostos: Ostos) => {
    apiKutsu("DELETE", undefined, ostos.id);
  };

  const lisaaTuote = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const tuote = uusiTuote.trim();

    apiKutsu("POST", {
      id: 0,
      tuote,
      poimittu: false,
    });

    setUusiTuote("");
  };

  const apiKutsu = async (
    metodi: Metodi = "GET",
    ostos?: Ostos,
    id?: number,
  ): Promise<void> => {
    setApiData((edellinen) => ({
      ...edellinen,
      haettu: false,
    }));

    let url = id !== undefined ? `${API_URL}/${id}` : API_URL;

    let asetukset: RequestInit = { method: metodi };

    if (metodi === "POST") {
      asetukset.headers = { "Content-Type": "application/json" };
      asetukset.body = JSON.stringify(ostos);
    }

    try {
      const yhteys = await fetch(url, asetukset);

      if (yhteys.ok) {
        const ostokset: Ostos[] = await yhteys.json();

        setApiData((edellinen) => ({
          ...edellinen,
          ostokset,
          haettu: true,
        }));
      } else {
        let virheViesti: string = "";

        switch (yhteys.status) {
          case 400:
            virheViesti = "Virhe pyynnön tiedoissa";
            break;
          default:
            virheViesti = "Palvelimella tapahtui odottamaton virhe";
            break;
        }

        setApiData((edellinen) => ({
          ...edellinen,
          virhe: virheViesti,
          haettu: true,
        }));
      }
    } catch {
      setApiData((edellinen) => ({
        ...edellinen,
        virhe: "Palvelimeen ei saada yhteyttä",
        haettu: true,
      }));
    }
  };

  useEffect(() => {
    apiKutsu();
  }, []);

  return (
    <>
      <CssBaseline />
      <Container>
        <Typography variant="h5" component="h1" sx={{ marginBottom: 3 }}>
          Demo 6: Ostoslistan asiakassovelluksen toteutus
        </Typography>
        <Typography variant="h6" component="h2" sx={{ marginBottom: 3 }}>
          Ostoslista
        </Typography>

        {apiData.virhe && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {apiData.virhe}
          </Alert>
        )}

        <List>
          {apiData.ostokset.map((ostos: Ostos) => {
            return (
              <ListItem
                key={ostos.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label={`Poista ${ostos.tuote}`}
                    onClick={() => poistaTuote(ostos)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={ostos.tuote} />
              </ListItem>
            );
          })}
        </List>

        <Stack component="form" onSubmit={lisaaTuote} spacing={2}>
          <TextField
            label="Uusi tuote"
            name="uusiTuote"
            value={uusiTuote}
            onChange={(e) => setUusiTuote(e.target.value)}
            fullWidth
          />

          <Button type="submit" variant="contained" size="large" fullWidth>
            Lisää tuote ostoslistaan
          </Button>
        </Stack>

        <Backdrop
          open={!apiData.haettu}
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Container>
    </>
  );
};

export default App;
