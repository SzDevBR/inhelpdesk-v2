// models.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Definindo o esquema do usuário
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
});

// Método para comparar a senha fornecida com a senha armazenada no banco de dados
userSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Pré-processamento da senha antes de salvar o usuário no banco de dados
userSchema.pre('save', async function (next) {
  try {
    // Se a senha não foi modificada, passe para a próxima etapa
    if (!this.isModified('password')) {
      return next();
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;

    next();
  } catch (error) {
    next(error);
  }
});

// Modelo do usuário
const User = mongoose.model('User', userSchema);

// Definindo o esquema do chamado
const ticketSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  attachment: { type: String, default: null },
  status: { type: String, enum: ['pending', 'responded'], default: 'pending' },
  response: { type: String, default: null },
});

// Modelo do chamado
const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = { User, Ticket };

