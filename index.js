// app.js
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const { User, Ticket } = require('./models');
const bcrypt = require('bcryptjs');
const mongoose = require('./db');

const app = express();
const PORT = 3000;

// Configurações do Express
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(flash());

app.use(express.static('public'));

// Middleware para verificar se o usuário está logado
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('message', 'Faça login para acessar esta página.');
  res.redirect('/login');
};

// Middleware para verificar se o usuário é um administrador
const isAdminMiddleware = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  req.flash('message', 'Acesso restrito. Somente administradores podem acessar esta página.');
  res.redirect('/');
};

// Rota para a página inicial
app.get('/', (req, res) => {
  res.render('index', { message: req.flash('message') });
});

// Rota para exibir o formulário de registro
app.get('/register', (req, res) => {
  res.render('register', { message: req.flash('message') });
});

// Rota para processar o registro do usuário
app.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      req.flash('message', 'As senhas não coincidem. Tente novamente.');
      return res.redirect('/register');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.flash('message', 'O nome de usuário já está em uso. Escolha outro nome.');
      return res.redirect('/register');
    }

    const newUser = new User({ username, password });
    await newUser.save();

    req.flash('message', 'Registro realizado com sucesso! Faça login para continuar.');
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    req.flash('message', 'Ocorreu um erro ao registrar o usuário.');
    res.redirect('/register');
  }
});

// Rota para exibir o formulário de login
app.get('/login', (req, res) => {
  res.render('login', { message: req.flash('message') });
});

// Rota para processar o login do usuário
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      req.flash('message', 'Nome de usuário não encontrado. Verifique o nome de usuário ou registre-se para criar uma conta.');
      return res.redirect('/login');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      req.flash('message', 'Senha incorreta. Verifique sua senha e tente novamente.');
      return res.redirect('/login');
    }

    req.session.user = user;
    if (user.isAdmin) {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/user/dashboard');
    }
  } catch (error) {
    console.error(error);
    req.flash('message', 'Ocorreu um erro durante o login. Por favor, tente novamente.');
    res.redirect('/login');
  }
});

// Rota para a página do usuário
app.get('/user/dashboard', isLoggedIn, async (req, res) => {
  try {
    const userTickets = await Ticket.find({ user: req.session.user._id });
    res.render('userDashboard', { user: req.session.user, tickets: userTickets });
  } catch (error) {
    console.error(error);
    req.flash('message', 'Ocorreu um erro ao carregar o painel do usuário.');
    res.redirect('/');
  }
});

// Rota para a página do administrador
app.get('/admin/dashboard', isAdminMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ status: 'open' }).populate('user', 'username');
    res.render('adminDashboard', { tickets });
  } catch (error) {
    console.error(error);
    req.flash('message', 'Ocorreu um erro ao carregar o painel do administrador.');
    res.redirect('/');
  }
});
app.get('/user/create-ticket', isLoggedIn, (req, res) => {
  res.render('createTicket', { message: req.flash('message') });
}); 

app.post('/user/create-ticket', isLoggedIn, async (req, res) => {
  try {
    const { subject, description, category } = req.body;

    // Crie um novo chamado e salve-o no banco de dados
    const newTicket = new Ticket({ user: req.session.user._id, subject, description, category });
    await newTicket.save();

    // Redirecione para o painel do usuário com uma mensagem de sucesso
    req.flash('message', 'Chamado criado com sucesso!');
    res.redirect('/user/dashboard');
  } catch (error) {
    console.error(error);
    req.flash('message', 'Ocorreu um erro ao criar o chamado.');
    res.redirect('/user/create-ticket');
  }
});




// Rota para o logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
