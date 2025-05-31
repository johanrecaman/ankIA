import db from '../db.js'

export const getFlashcards = async (_, res) => {
  const sql = 'SELECT * FROM flashcards';
  db.all(sql, [], (err, flashcards) =>{
    if(err){
      return res.status(500).json({error: "Erro ao buscar flashcards"});
    }
    return res.json(flashcards)
  })
}

export const createFlashcard = async (req, res) => {
  const {title, question, answer} = req.body;

  const sql = 'INSERT INTO flashcards (title, question, answer) VALUES (?, ?, ?)';
  const params = [title, question, answer]

  db.run(sql, params, (err) => {
    if (err){
      return res.status(500).json({erros: "Erro ao criar flashcard"});
    }
    return res.status(201).json({message: "Flashcard criado com sucesso!"});
  });
}
