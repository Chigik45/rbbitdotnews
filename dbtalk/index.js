const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const url = require('url');
const fetch = require('node-fetch');
const natural = require('natural');
const app = express();
const tokenizer = new natural.WordTokenizer();
const bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use(cors());

const params = url.parse('postgres://postgres:postgres@db/postgres');
const auth = params.auth.split(':');

const pool = new Pool({
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: 'mydb'
});


// user crud
app.get('/getmain', async (req, res) => {
  const client = await pool.connect();
  const result = await client.query('SELECT * FROM article');
  const results = { 'results': (result) ? result.rows : null};
  res.send(JSON.stringify(results));
  client.release();
});

app.post('/auth', async (req, res) => {
  const client = await pool.connect();
  console.log(req.body)
  const { login, password} = req.body;
  let result = '';
  if ((await client.query('SELECT * FROM auth_user WHERE username=$1', [login])).rows.length == 0)
    {
      result = await client.query('INSERT INTO auth_user (username, password) VALUES ($1, $2) RETURNING *', [login, password]);
    }
  res.send(result.rows[0]);
  client.release();
});





app.get('/users', async (req, res) => {
  const client = await pool.connect();
  const result = await client.query('SELECT * FROM auth_user');
  const results = { 'results': (result) ? result.rows : null};
  res.send(JSON.stringify(results));
  client.release();
});


app.post('/users', async (req, res) => {
  const client = await pool.connect();
  const { username, password} = req.body;
  const result = await client.query('INSERT INTO auth_user (username, password) VALUES ($1, $2) RETURNING *', [username, password]);
  res.send(result.rows[0]);
  client.release();
});


app.put('/users/:uname', async (req, res) => {
  const client = await pool.connect();
  const { uname } = req.params;
  const { username, password} = req.body;
  const result = await client.query('UPDATE auth_user SET username = $1, password = $2 WHERE username = $3 RETURNING *', [username, password, uname]);
  res.send(result.rows[0]);
  client.release();
});


app.delete('/users/:uname', async (req, res) => {
  const client = await pool.connect();
  const { uname } = req.params;
  const result = await client.query('DELETE FROM auth_user WHERE username = $1', [uname]);
  res.send({ message: 'User deleted' });
  client.release();
});


// meta newspaper 53cc1ea278254ee1849bf6ed02a433d9
async function MakeMetaRevision() {
  var url = 'https://newsapi.org/v2/top-headlines?country=ru&apiKey=53cc1ea278254ee1849bf6ed02a433d9';
  const client = await pool.connect();

  var response = await fetch(url);
  var json = await response.json();
  var articles = json.articles;

  for (let article of articles) {
      let sourceName = article.source.name;
      let articleTitle = article.title;
      let articleUrl = article.url;
      console.log(sourceName + " " + articleTitle);

      let text = articleTitle.toLowerCase();
      let nouns = tokenizer.tokenize(text);

      // Добавляем источник новостей, если его еще нет
      let insertNewspaperQuery = `INSERT INTO newspaper (name) VALUES ('${sourceName}') ON CONFLICT (name) DO NOTHING`;
      await client.query(insertNewspaperQuery);

      // Проверяем, есть ли статья уже в базе данных
      let checkArticleQuery = `SELECT * FROM article WHERE url = '${articleUrl}'`;
      let checkArticleResult = await client.query(checkArticleQuery);

      if (checkArticleResult.rows.length === 0) {
          // Добавляем статью
          let insertArticleQuery = `INSERT INTO article (name, url, newspaper) VALUES ('${articleTitle}', '${articleUrl}', (SELECT newspaper_id FROM newspaper WHERE name = '${sourceName}')) RETURNING article_id`;
          let articleResult = await client.query(insertArticleQuery);
          let articleId = articleResult.rows[0].article_id;

          // Добавляем теги и связываем их со статьей
          for (let noun of nouns) {
              let insertTagQuery = `INSERT INTO tag (name) VALUES ('${noun}') ON CONFLICT (name) DO NOTHING`;
              await client.query(insertTagQuery);

              let insertAssociationQuery = `INSERT INTO article_tag_assotiation (tag_id, article_id) VALUES ((SELECT tag_id FROM tag WHERE name = '${noun}'), ${articleId})`;
              await client.query(insertAssociationQuery);
          }
      }
  }

  client.end();
}



app.listen(3001, () => console.log(`Listening on 3001`))
setTimeout(() => {
  MakeMetaRevision();
}, 5000); // Задержка в 5 секунд
