const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importando o pacote CORS
const { isPointInPolygon } = require('geolib');
const nodemailer = require('nodemailer'); // Adicionar Nodemailer

const app = express();
const PORT = 3000;

// Configurar o CORS para permitir todas as origens
app.use(cors({
  origin: '*',  // Permitir todas as origens
}));

app.use(bodyParser.json());

// Definindo a área delimitada (um polígono representado por coordenadas)
const areaPolygon = [
  { latitude: -8.116557959477069, longitude: -34.90060028201318 },
  { latitude: -8.117070646978544, longitude: -34.89955500864675 },
  { latitude: -8.117859076221087, longitude: -34.900065795174406 },
  { latitude: -8.117513882860841, longitude: -34.90081681365291 },
];

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
  service: 'gmail', // Ou use outro provedor
  auth: {
    user: 'andre.nascimento@novaroma.edu.br',
    pass: 'novaroma2024', // Use senhas de aplicação se disponível
  },
});

// Função para enviar e-mail
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: '"Pet Tracker" <andre.nascimento@novaroma.edu.br>',
      to,
      subject,
      text,
    });
    console.log('E-mail enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
  }
};


// Coordenada inicial do pet
let petLocation = { latitude: -8.1170, longitude: -34.9000 };

// Função para validar coordenadas
const validateCoordinates = (coord) => {
  return (
    coord &&
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number'
  );
};

// Função para simular o movimento do pet
const simulatePetMovement = (startCoord) => {
  if (!validateCoordinates(startCoord)) {
    throw new Error('Coordenadas inválidas');
  }

  return {
    latitude: startCoord.latitude + (Math.random() - 0.5) * 0.001, // Incremento pequeno
    longitude: startCoord.longitude + (Math.random() - 0.5) * 0.001,
  };
};

// Endpoint para verificar se o pet está dentro da área
app.post('/check-location', async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!validateCoordinates({ latitude, longitude })) {
    return res.status(400).json({ error: 'Coordenadas inválidas' });
  }

  petLocation = { latitude, longitude };

  const isInside = isPointInPolygon(petLocation, areaPolygon);

  // Enviar e-mail se o pet sair da área
  if (!isInside) {
    await sendEmail(
      'andre.nascimento@novaroma.edu.br', // E-mail de destino
      'Alerta: Seu pet saiu da área de segurança!',
      `O pet saiu da área em latitude: ${latitude}, longitude: ${longitude}`
    );
  }

  res.json({
    petLocation,
    status: isInside ? 'inside' : 'outside',
    message: isInside
      ? 'O pet está dentro da área.'
      : 'Alerta! O pet saiu da área!',
  });
});


// Endpoint para simular o movimento do pet e verificar a posição
app.get('/simulate-pet', (req, res) => {
  try {
    petLocation = simulatePetMovement(petLocation);

    const isInside = isPointInPolygon(
      petLocation,
      areaPolygon
    );

    res.json({
      petLocation,
      status: isInside ? 'inside' : 'outside',
      message: isInside
        ? 'O pet está dentro da área.'
        : 'Alerta! O pet saiu da área!',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obter a localização atual do pet
app.get('/current-location', (req, res) => {
  const isInside = isPointInPolygon(petLocation, areaPolygon);

  res.json({
    petLocation,
    status: isInside ? 'inside' : 'outside',  // Status atualizado
    message: isInside ? 'O pet está dentro da área.' : 'Alerta! O pet saiu da área!',
  });
});

// Servidor em execução
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
