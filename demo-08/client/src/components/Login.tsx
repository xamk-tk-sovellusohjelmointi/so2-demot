import {
  type Dispatch,
  type SetStateAction,
  type SubmitEvent,
  useState,
} from "react";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, type NavigateFunction } from "react-router";

interface Props {
  setToken: Dispatch<SetStateAction<string>>;
}

interface LomakeTiedot {
  kayttajatunnus: string;
  salasana: string;
}

const Login = (props: Props) => {
  const navigate: NavigateFunction = useNavigate();

  const [lomakeTiedot, setLomakeTiedot] = useState<LomakeTiedot>({
    kayttajatunnus: "",
    salasana: "",
  });

  const [virhe, setVirhe] = useState<string>("");

  const kirjaudu = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();

    setVirhe("");

    if (!lomakeTiedot.kayttajatunnus || !lomakeTiedot.salasana) {
      setVirhe("Anna käyttäjätunnus ja salasana");
      return;
    }

    try {
      const yhteys = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kayttajatunnus: lomakeTiedot.kayttajatunnus,
          salasana: lomakeTiedot.salasana,
        }),
      });

      if (yhteys.ok) {
        let { token } = await yhteys.json();

        props.setToken(token);

        localStorage.setItem("token", token);

        navigate("/");
      } else {
        let virheViesti: string = "";

        switch (yhteys.status) {
          case 400:
            virheViesti = "Virhe pyynnön tiedoissa";
            break;
          case 401:
            virheViesti = "Käyttäjää ei löydy";
            break;
          default:
            virheViesti = "Palvelimella tapahtui odottamaton virhe";
            break;
        }

        setVirhe(`${virheViesti}`);
      }
    } catch {
      setVirhe("Palvelimeen ei saatu yhteyttä");
    }
  };

  return (
    <Backdrop open={true}>
      <Paper sx={{ padding: 2 }}>
        <Box
          component="form"
          onSubmit={kirjaudu}
          style={{
            width: 300,
            backgroundColor: "#fff",
            padding: 20,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6">Kirjaudu sisään</Typography>
            {virhe && (
              <Alert severity="error" onClose={() => setVirhe("")}>
                {virhe}
              </Alert>
            )}
            <TextField
              label="Käyttäjätunnus"
              name="kayttajatunnus"
              onChange={(e) => {
                setLomakeTiedot((edellinen) => ({
                  ...edellinen,
                  kayttajatunnus: e.target.value,
                }));
              }}
            />
            <TextField
              label="Salasana"
              name="salasana"
              type="password"
              onChange={(e) => {
                setLomakeTiedot((edellinen) => ({
                  ...edellinen,
                  salasana: e.target.value,
                }));
              }}
            />
            <Button type="submit" variant="contained" size="large">
              Kirjaudu
            </Button>
            <Typography>
              (Kirjaudu testitunnuksilla: käyttäjä:TestUser, salasana:passu123)
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Backdrop>
  );
};

export default Login;
