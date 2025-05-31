import express from 'express'
import cors from 'cors'
import router from './routes/flashcards.js'

const app = express();


app.use(express.json());
app.use(cors());
app.use('/flashcards', router);

app.listen(3001);
