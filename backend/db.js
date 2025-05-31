import sqlite3 from 'sqlite3';

const {Database} = sqlite3;

const db = new Database('./flashcards.db', (err)=>{
  if(err){
    console.error('Erro ao abrir o banco de dados:', err.message);
  }
  else{
    console.log('Conectado ao banco de dados SQLite');
  }
});

db.exec(
   `CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    question TEXT,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  (err)=>{
    if(err){
      console.error('Erro ao criar tabelas:', err.message);
    }
  }
)

export default db;
