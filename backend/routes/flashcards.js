import express from 'express';
import {getFlashcards, createFlashcard} from '../controllers/flashcards.js'

const router = express.Router();

router.get('/', getFlashcards);
router.get('/:id')
router.post('/', createFlashcard);

export default router
