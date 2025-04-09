const express = require('express'); // Framework web para para node js - cria servidor
const app = express(); // instancia o express
const mysql = require("mysql2"); // biblioteca para conexão com o banco de dados
const bodyParser = require("body-parser"); // middleware para analise de corpos de requisição

app.use(express.static('public'));

//configuração da conexão com o banco de dados MySql
const connection = mysql.createConnection({
    host: 'localhost', //endereço do banco de dados
    user: 'root', //nome do usuario do banco
    password: 'root', // senha do banco
    database: 'agencia_viagens', // nome do banco
    port: 3306 // porta do banco
});

//estabelece conxão com o banco e dados e emite uma mensagem se der erro
connection.connect(function(err){
    if(err){
        console.error("ERRO ", err);
        return
    } console.log("Conexão ok! ")
});

//middleware para analise de corpos de requiição
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}));

app.get("/", function(req,res) {
    res.sendFile(__dirname + "/login.html")
});

app.get("/home", function(req,res) {
    res.sendFile(__dirname + "/index.html")
});

app.get("/cadastro", function(req,res) {
    res.sendFile(__dirname + "/cadastro.html")
});

app.get("/recuperacao", function(req, res){
    res.sendFile(__dirname + "/recuperarSenha.html") 
})

app.post("/recuperar", function(req, res){
    const username = req.body.email;
    const password = req.body.senha;
    
    const esquecer = "UPDATE usuarios SET senha = ? WHERE email = ?"

    connection.query(esquecer, [password, username], function(err, result){
        if (err){
            console.error("Erro ao recuperar a senha ", err)
            res.status(500).send("Erro interno ao recuperar a senha!")
        }else {
            console.log("Senha recuperada com sucesso");
            res.redirect("/");
        }
    })
});


app.post("/cadastrar", function(req,res) {
    const username = req.body.email;
    const password = req.body.senha;

    const insert = "INSERT INTO usuarios (email, senha) VALUES (?,?)";

    connection.query(insert, [username,password], function(err, result){
        if(err){
            console.error("Erro ao inserir usuario", err);
            res.status(500).send("Erro interno ao inserir usuario");
            return
        }else{
            console.log("Usuario cadastrado com sucesso!");
            res.redirect("/");
        }
    })
});

app.post("/login", function(req,res){
    const username = req.body.email;
    const password = req.body.senha;

    connection.query('SELECT * FROM usuarios WHERE email=? AND senha=?',
        [username, password], function(error, results, fields){
            if(error){
                console.error("Erro ao executar a consulta " + error);
                res.status(500).send("ERRO interno ao verificar credenciais. ");
                return
            }if(results.length>0){
                res.redirect("/home" );
            }else{
                res.render('login', {erroeMessage: 'Credenciais inválidas. ', username:username});
                return
            }
        })

});

// Rota para listar viagens
app.get('/listar', (req, res) => {
    const listar = 'SELECT * FROM viagens';

    connection.query(listar, function(err, rows){
        if (!err){
            console.log("Consulta realizada com sucesso!")
            res.send(`
                <html>
                    <head>
                        <title>Relatório de estoque</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');

                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                                font-family: 'Poppins', sans-serif;
                            }

                            body {
                                background: #f8f9fa;
                                color: #333;
                                text-align: center;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                min-height: 100vh;
                                padding: 20px;
                            }

                            h1 {
                                font-size: 2.5em;
                                color: #333;
                                text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
                                animation: fadeIn 1s ease-in-out;
                            }

                            @keyframes fadeIn {
                                from { opacity: 0; transform: translateY(-20px); }
                                to { opacity: 1; transform: translateY(0); }
                            }

                            /* Estilização da tabela */
                            table {
                                width: 80%;
                                margin-top: 20px;
                                border-collapse: collapse;
                                background: white;
                                border-radius: 10px;
                                overflow: hidden;
                                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                            }

                            th, td {
                                padding: 15px;
                                border: 1px solid #ddd;
                                text-align: center;
                            }

                            th {
                                background: #ff4081;
                                color: white;
                                font-size: 1.2em;
                            }

                            td {
                                background: #fff;
                                font-size: 1em;
                            }

                            /* Link de voltar */
                            a {
                                display: inline-block;
                                background: #ff4081;
                                color: white;
                                padding: 10px 20px;
                                margin-top: 20px;
                                border-radius: 25px;
                                font-size: 1em;
                                font-weight: bold;
                                text-decoration: none;
                                transition: background 0.3s, transform 0.2s;
                                border: none;
                                cursor: pointer;
                            }

                            a:hover {
                                background: #f50057;
                                transform: scale(1.05);
                            }


                        </style>
                    </head>
                    <body>
                        <h1>Relatório de estoque</h1>

                        <table>
                            <tr>
                                <th>Código</th>
                                <th>Destino</th>
                                <th>Data viagem</th>
                                <th>Valor</th>
                                <th>Vagas</th>
                                <th>Ações</th>
                            </tr>

                            ${rows.map(row => `
                                <tr>
                                    <td>${row.id}</td>
                                    <td>${row.destino}</td>
                                    <td>${row.data_viagem.toLocaleDateString('pt-BR')}</td>
                                    <td>${row.preco}</td>
                                    <td>${row.vagas}</td>
                                    <td><a href="/excluir/${row.id}">Excluir</a>
                                        <a href="/editar/${row.id}">Editar</a></td>
                                </tr>
                                `).join('')}
                        </table>
                        <a href='/home'> Voltar </a>
                    </body>
                </html>
                `);
        } else{
            console.log("Erro no relatório de estoque ", err);
            res.send("Erro")
        }
    })
});

// Rota para cadastrar viagens
app.post('/home', (req, res) => {
    //capturar os campos do form html
    const destino = req.body.destino;
    const data_viagem = req.body.data_viagem;
    const preco = req.body.preco; 
    const vagas = req.body.vagas;

    const values = [destino, data_viagem, preco, vagas];
    const insert = "INSERT INTO viagens (destino, data_viagem, preco, vagas) VALUES (?,?,?,?)";

    connection.query(insert, values, function(err, result){
        if (!err) {
            console.log("Dados inseridos com sucesso")
            res.redirect("/listar")
        }
        else{
            console.log("Não foi possivel inserir os dados ", err)
            res.send("Erro!")
        }
    })

});

app.get("/excluir/:id", function(req, res){
    const id = req.params.id;

    connection.query('DELETE FROM viagens where id = ?', [id], function(err, result) {
        if(err){
            console.error("Erro ao excluir o produto: ", err);
            res.status(500).send('Erro interno ao excluir o produto.');
            return;
        }

        console.log("Produto excluido com sucesso!");
        res.redirect('/listar');
    });
});

app.get("/editar/:id", function(req,res){
    const id = req.params.id;
    const select = "SELECT * FROM viagens WHERE id = ?";

    connection.query(select, [id], function(err, rows){
        if(!err){
            console.log("Produto encontrado com sucesso!");~
            res.send(`
                <!DOCTYPE html>
                    <html lang="pt-br">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Editar Produto</title>
                        <style>
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                                font-family: Arial, sans-serif;
                            }
                            body {
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                background: #f5f5f5;
                            }
                            .edit-container {
                                display: flex;
                                width: 600px;
                                background: white;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                border-radius: 8px;
                                overflow: hidden;
                            }
                            .edit-left {
                                width: 40%;
                                background: linear-gradient(to right, #ff4081, #f50057);
                                color: white;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                padding: 20px;
                            }
                            .edit-left h1 {
                                font-size: 24px;
                                margin-bottom: 10px;
                            }
                            .edit-left p {
                                font-size: 14px;
                                text-align: center;
                            }
                            .edit-right {
                                width: 60%;
                                padding: 40px;
                            }
                            .edit-right h1 {
                                font-size: 22px;
                                margin-bottom: 10px;
                                color: #333;
                            }
                            .edit-right p {
                                font-size: 14px;
                                margin-bottom: 20px;
                                color: #555;
                            }
                            label {
                                display: block;
                                font-weight: bold;
                                margin-top: 10px;
                            }
                            input[type="text"],
                            input[type="date"],
                            input[type="number"] {
                                width: 100%;
                                padding: 10px;
                                margin-top: 5px;
                                border: 1px solid #ccc;
                                border-radius: 5px;
                            }
                            .btn {
                                width: 100%;
                                padding: 10px;
                                background: linear-gradient(to right, #ff4081, #f50057);
                                color: white;
                                border: none;
                                border-radius: 5px;
                                cursor: pointer;
                                margin-top: 20px;
                                font-weight: bold;
                            }
                            .btn:hover {
                                background: linear-gradient(to right, #ff5e9d, #ff2e6a);
                            }
                        </style>
                    </head>
                    <body>
                        <div class="edit-container">
                            <div class="edit-left">
                                <h1>Editar</h1>
                                <p>Atualize os dados da sua viagem aqui.</p>
                            </div>
                            <div class="edit-right">
                                <h1>✏️ Editar Produto</h1>
                                <p>Modifique os dados e clique em <strong>Salvar</strong> para atualizar.</p>
                                <form action="/editar/${id}" method="POST">
                                    <label for="destino">Destino:</label>
                                    <input type="text" name="destino" value="${rows[0].destino}" required>

                                    <label for="data_viagem">Data da viagem:</label>
                                    <input type="date" name="data_viagem" value="${rows[0].data_viagem}" required>

                                    <label for="preco">Preço:</label>
                                    <input type="number" name="preco" value="${rows[0].preco}" required>

                                    <label for="vagas">Vagas:</label>
                                    <input type="number" name="vagas" value="${rows[0].vagas}" required>

                                    <input type="submit" value="Salvar" class="btn">
                                </form>
                            </div>
                        </div>
                    </body>
                    </html>`);
        }else{
            console.log("Erro ao buscar o produto ", err);
            res.send("Erro")
        }
    });
 
});

app.post('/editar/:id', function(req, res){
    const id = req.params.id; // Obtém o ID do produto a ser editado da URL
    const destino = req.body.destino; // Obtém a nova descrição do corpo da requisição
    const data_viagem = req.body.data_viagem; // Obtém a nova data_viagem do corpo da requisição
    const preco = req.body.preco; // Obtém o novo valor unitário do corpo da requisição
    const vagas = req.body.vagas; // Obtém o novo vags do corpo da requisição
 
    const update = "UPDATE viagens SET destino = ?, data_viagem = ?, preco = ?, vagas =? WHERE id = ?";
 
    connection.query(update, [destino, data_viagem, preco,vagas, id], function(err, result){
        if(!err){
            console.log("Produto editado com sucesso!");
            res.redirect('/listar'); // Redireciona para a página de listagem após a edição
        }else{
            console.log("Erro ao editar o produto ", err);
            res.send("Erro")
        }
    });
});

// Inicia o servidor
app.listen(8083, function(){
    console.log("Servidor rodando na url http://localhost:8083");
});