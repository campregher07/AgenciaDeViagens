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
                            </tr>

                            ${rows.map(row => `
                                <tr>
                                    <td>${row.id}</td>
                                    <td>${row.destino}</td>
                                    <td>${row.data_viagem.toLocaleDateString('pt-BR')}</td>
                                    <td>${row.preco}</td>
                                    <td>${row.vagas}</td>
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

// Inicia o servidor
app.listen(8083, function(){
    console.log("Servidor rodando na url http://localhost:8083");
});