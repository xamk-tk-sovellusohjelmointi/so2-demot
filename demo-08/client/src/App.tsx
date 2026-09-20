import { useState } from "react";
import { Container, Typography } from "@mui/material";
import { Route, Routes } from "react-router";
import Ostoslista from "./components/Ostoslista";
import Login from "./components/Login";

const App = () => {
  const [token, setToken] = useState<string>(
    String(localStorage.getItem("token")),
  );

  return (
    <Container>
      <Typography variant="h5" component="h1" sx={{ marginBottom: 3 }}>
        Demo 8: Käyttäjähallinta
      </Typography>

      <Typography variant="h6" component="h2" sx={{ marginBottom: 3 }}>
        Ostoslista
      </Typography>

      <Routes>
        <Route path="/" element={<Ostoslista token={token} />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
      </Routes>
    </Container>
  );
};

export default App;
