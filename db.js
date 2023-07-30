// db.js
const mongoose = require('mongoose');

// URL do banco de dados MongoDB
const mongoURI = 'mongodb+srv://inderux:inderux@cluster0.yuzl0.mongodb.net/?retryWrites=true&w=majority';

// Configuração do MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Verificar se a conexão foi estabelecida com sucesso
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro de conexão com o MongoDB:'));
db.once('open', () => {
  console.log('Conexão com o MongoDB estabelecida com sucesso!');
});

module.exports = db;
