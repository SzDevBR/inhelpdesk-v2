// app.js
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const { User, Ticket } = require('./models');
const bcrypt = require('bcryptjs');
const mongoose = require('./db');
const bodyParser = require('body-parser');
const multer = require('multer'); // Adicione esta linha para lidar com o upload de arquivos
const path = require('path');

const app = express();
const PORT = 3000;

const db = require('./db');
const Ticket = require('./models');


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

const upload = multer({
  dest: 'uploads/', // Diretório onde os arquivos serão armazenados temporariamente
  limits: {
    fileSize: 50 * 1024 * 1024, // Limite de 50 MB em bytes
  },
});

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

// Rota para renderizar o painel de administração
app.get('/admin/dashboard', (req, res) => {
  // Aqui você pode buscar os chamados pendentes no banco de dados e passá-los para a página de adminDashboard.ejs
  // Exemplo:
  Ticket.find({ status: 'pending' }, (err, tickets) => {
    if (err) {
      console.error('Erro ao buscar os chamados pendentes:', err);
      res.status(500).send('Erro ao buscar os chamados pendentes.');
    } else {
      res.render('adminDashboard', { tickets });
    }
  });
});

// Rota para renderizar a página de resposta de chamados
app.get('/admin/respond-ticket/:id', (req, res) => {
  // Aqui você pode buscar o chamado pelo ID no banco de dados e passá-lo para a página de respondTicket.ejs
  // Exemplo:
  const ticketId = req.params.id;
  Ticket.findById(ticketId, (err, ticket) => {
    if (err) {
      console.error('Erro ao buscar o chamado:', err);
      res.status(500).send('Erro ao buscar o chamado.');
    } else {
      res.render('respondTicket', { ticket });
    }
  });
});

// Rota para tratar o envio da resposta do chamado
app.post('/admin/respond-ticket/:id', (req, res) => {
  // Aqui você pode atualizar o chamado com a resposta do administrador e alterar o status para "responded"
  // Exemplo:
  const ticketId = req.params.id;
  const response = req.body.response;

  Ticket.findByIdAndUpdate(
    ticketId,
    { response: response, status: 'responded' },
    (err, ticket) => {
      if (err) {
        console.error('Erro ao atualizar o chamado:', err);
        res.status(500).send('Erro ao atualizar o chamado.');
      } else {
        res.redirect('/admin/dashboard');
      }
    }
  );
});



// Rota para renderizar a página de criação de chamados
app.get('/create-ticket', (req, res) => {
  res.render('createTicket');
});

// Rota para tratar o envio do formulário de criação de chamados
app.post('/create-ticket', upload.single('attachment'), (req, res) => {
  const { subject, category, description } = req.body;

  // Acesso ao arquivo enviado pelo usuário (se fornecido)
  const attachment = req.file;
  // Aqui você pode salvar o arquivo em um local permanente, se necessário

  // Crie um novo chamado no banco de dados
  const newTicket = new Ticket({
    subject,
    category,
    description,
    attachment: attachment ? attachment.filename : null, // Armazena o nome do arquivo se houver anexo
  });

  newTicket.save((err, savedTicket) => {
    if (err) {
      console.error('Erro ao criar o chamado:', err);
      res.status(500).send('Erro ao criar o chamado.');
    } else {
      const message = 'Chamado criado com sucesso!';
      res.redirect('/create-ticket');
    }
  });
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
