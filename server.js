const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const cors = require('cors')
const deepl = require('deepl-node');
const bodyParser = require('body-parser')
const translator = new deepl.Translator('6349e08e-8733-e586-4828-d79712e74f63:fx');

const app = express();
// app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors())
app.use(express.static('public'))

const server = createServer(app);
const io = new Server(server);


app.get('/', (req, res) => {
  res.sendFile(join(__dirname, './index.html'));
});

app.post('/v1/translate', (req, res) => {
  translator
  .translateText(`${req.body.text}`, null, req.body.target_lang)
  .then((result) => {
    res.send(result.text)
  })
  .catch((error) => {
    console.log(error)
    res.status(500)
    res.send()
  });
  
})

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('translation', (msg, blob) => {
    console.log('message: ' + msg);
    
    io.emit('translation', (msg, blob));
  });
});


server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
// app.listen(3000, () => {
//   console.log('server running at http://localhost:3000');
// });
