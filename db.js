// db.js
const mongoose = require('mongoose');

// URL do banco de dados MongoDB
const MONGODB_URI = 'mongodb+srv://inderux:inderux@cluster0.yuzl0.mongodb.net/?retryWrites=true&w=majority';

// Configuração e conexão com o MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Conectado ao MongoDB');
  })
  .catch((error) => {
    console.error('Erro ao conectar ao MongoDB:', error.message);
  });

module.exports = mongoose;