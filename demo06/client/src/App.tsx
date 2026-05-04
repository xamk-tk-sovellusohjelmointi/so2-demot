import { useEffect, useRef, useState } from "react";
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
import DeleteIcon from "@mui/icons-material/Delete";

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

function App() {
  const lomakeRef = useRef<HTMLFormElement>(null);
  const [apiData, setApiData] = useState<ApiData>({
    ostokset: [],
    virhe: "",
    haettu: false,
  });

  const poistaTuote = (ostos: Ostos): void => {
    apiKutsu("DELETE", undefined, ostos.id);
  };

  const lisaaTuote = (e: React.SubmitEvent): void => {

    e.preventDefault();

    const lomake = lomakeRef.current;

    if (!lomake) return;
    
    const tuoteKentta = lomake.elements.namedItem("uusiTuote") as HTMLInputElement;
    const uusiTuote = tuoteKentta.value;
    
    apiKutsu("POST", {
      id: 0,
      tuote: uusiTuote,
      poimittu: false
    });
  };

  const apiKutsu = async (
    metodi?: string,
    ostos?: Ostos,
    id?: number,
  ) => {
    setApiData((data) => ({ ...data, haettu: false }));

    const url = id
      ? `http://localhost:3006/api/ostokset/${id}`
      : "http://localhost:3006/api/ostokset";

    let asetukset: RequestInit = { method: metodi ?? "GET" };

    if (metodi === "POST") {
      asetukset = {
        ...asetukset,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ostos),
      };
    }

    try {
      const yhteys = await fetch(url, asetukset);

      if (yhteys.status === 200) {
        const data: Ostos[] = await yhteys.json();
        setApiData({ ostokset: data, virhe: "", haettu: true });
      } else {
        let virheteksti: string;
        switch (yhteys.status) {
          case 400:
            virheteksti = "Virhe pyynnön tiedoissa";
            break;
          default:
            virheteksti = "Palvelimella tapahtui odottamaton virhe";
            break;
        }
        setApiData((data) => ({ ...data, virhe: virheteksti, haettu: true }));
      }
    } catch {
      setApiData((data) => ({
        ...data,
        virhe: "Palvelimeen ei saada yhteyttä",
        haettu: true,
      }));
    }
  };

  useEffect(() => {
    apiKutsu();
  }, []);

  return (
    <Container>
      <Typography variant="h5">Demo 6: Asiakassovelluksen toteutus</Typography>
      <Typography variant="h6" sx={{ marginBottom: 2, marginTop: 2 }}>
        Ostoslista
      </Typography>

      {apiData.virhe ? (
        <Alert severity="error">{apiData.virhe}</Alert>
      ) : apiData.haettu ? (
        <Stack
          component="form"
          onSubmit={lisaaTuote}
          ref={lomakeRef}
          spacing={2}
        >
          <List>
            {apiData.ostokset.map((ostos: Ostos, idx: number) => (
              <ListItem
                key={idx}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => {
                      poistaTuote(ostos);
                    }}
                  >
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
      ) : (
        <Backdrop open>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </Container>
  );
};

export default App;
