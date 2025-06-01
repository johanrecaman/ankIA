import express from 'express';
import {getFlashcards, getFlashcardById, createFlashcard} from '../controllers/flashcards.js'

const router = express.Router();

router.get('/', getFlashcards);
router.get('/:id', getFlashcardById);
router.post('/', createFlashcard);

export default router
