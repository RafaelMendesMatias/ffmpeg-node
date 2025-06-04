const express = require('express');
const bodyParser = require('body-parser');
const ffmpeg = require('fluent-ffmpeg');
const { Readable } = require('stream');
const WritableStreamBuffer = require('stream-buffers').WritableStreamBuffer;

const app = express();
app.use(bodyParser.json({ limit: '20mb' })); // aceita até 20MB

app.post('/audio', (req, res) => {
  let { audioBase64 } = req.body;
  if (!audioBase64) {
    return res.status(400).json({ error: 'audioBase64 é obrigatório' });
  }

  if (audioBase64.includes(',')) {
    audioBase64 = audioBase64.split(',')[1];
  }

  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const inputStream = new Readable();
  inputStream.push(audioBuffer);
  inputStream.push(null);

  const outputStreamBuffer = new WritableStreamBuffer();

  ffmpeg(inputStream)
    .inputFormat('webm')
    .audioCodec('libopus')
    .format('ogg')
    .on('error', (err) => {
      console.error('Erro ffmpeg:', err);
      return res.status(500).json({ error: 'Erro na conversão', details: err.message });
    })
    .on('end', () => {
      const outputBuffer = outputStreamBuffer.getContents();
      if (!outputBuffer) {
        return res.status(500).json({ error: 'Erro ao obter saída do ffmpeg' });
      }
      const base64Ogg = outputBuffer.toString('base64');
      res.json({ audioOggBase64: base64Ogg });
    })
    .pipe(outputStreamBuffer, { end: true });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`FFmpeg API rodando na porta ${PORT}`));
