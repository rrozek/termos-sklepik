import express from 'express';
import {
  createKidController,
  deleteKidController,
  getKidByIdController,
  getKidByRfidController,
  getParentKidsController,
  updateKidController,
} from './kid.controller';

const kidRouter = express.Router();

// Get all kids for the parent
kidRouter.get('/', getParentKidsController);

// Get kid by ID
kidRouter.get('/:id', getKidByIdController);

// Get kid by RFID token
kidRouter.get('/rfid/:token', getKidByRfidController);

// Create a new kid
kidRouter.post('/', createKidController);

// Update a kid
kidRouter.put('/:id', updateKidController);

// Delete a kid
kidRouter.delete('/:id', deleteKidController);

export default kidRouter;
