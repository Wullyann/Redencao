// src/components/CharacterHeader.jsx
import React from 'react';

const CLASSES = ['Combatente', 'Especialista', 'Ocultista'];

export default function CharacterHeader({ ficha, onClasseChange }) {
  return (
    <div style={styles.container}>
      <img
        src={ficha['Imagem do Personagem'] || ''}
        alt={ficha['Nome do Personagem']}
        style={styles.avatar}
      />
      <div style={styles.info}>
        <h2 style={styles.name}>{ficha['Nome do Personagem']}</h2>
        <div style={styles.nex}>NEX: {ficha.NEX}%</div>
      </div>
      <select
        value={ficha.Classe}
        onChange={e => onClasseChange(e.target.value)}
        style={styles.classSelect}
      >
        {CLASSES.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    border: '2px solid #D4AF37',
    objectFit: 'cover',
    background: '#111',
  },
  info: {
    flex: 1,
  },
  name: {
    margin: 0,
    color: '#D4AF37',
    fontSize: 24,
  },
  nex: {
    marginTop: 4,
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: 16,
  },
  classSelect: {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid #D4AF37',
    borderRadius: 4,
    color: '#D4AF37',
    fontSize: 14,
    cursor: 'pointer',
  },
};
