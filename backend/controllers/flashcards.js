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

export const getFlashcardById = async (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT * FROM flashcards WHERE id = ?';
  db.get(sql, [id], (err, flashcard) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao buscar flashcard" });
    }
    if (!flashcard) {
      return res.status(404).json({ error: "Flashcard não encontrado" });
    }
    return res.json(flashcard);
  });
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
