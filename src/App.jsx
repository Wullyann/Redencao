// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Painel from './pages/Painel';
import FichaJogador from './pages/FichaJogador';
import CriarFicha from './pages/CriarFicha';
import Fichas from './pages/Fichas';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/painel" element={<Painel />} />
      <Route path="/ficha" element={<FichaJogador />} />
      <Route path="/criar-ficha" element={<CriarFicha />} />
      <Route path="/fichas" element={<Fichas />} />
      {/* adicione outras rotas aqui */}
    </Routes>
  );
}
