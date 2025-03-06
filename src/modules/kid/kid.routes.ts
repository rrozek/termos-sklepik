import express from 'express';
import {
  createKidController,
  deleteKidController,
  getKidByIdController,
  getKidByRfidController,
  getParentKidsController,
  updateKidController,
  getAllKidsController,
  addKidToSchoolController,
  removeKidFromSchoolController,
  updateKidSchoolsController,
} from './kid.controller';
import { adminMiddleware, staffMiddleware } from '@/middlewares/auth.middleware';

const kidRouter = express.Router();

// Parent routes - parents can only see and manage their own kids
kidRouter.get('/my', getParentKidsController);

// Admin/Staff routes - they can see all kids, but we'll use this for staff routes too
kidRouter.get('/all', staffMiddleware, getAllKidsController);

// Get kid by RFID token - used by kiosk
kidRouter.get('/rfid/:token', getKidByRfidController);

// Get kid by ID
// - Parents can only view their own kids
// - Admin/Staff can view any kid
kidRouter.get('/:id', getKidByIdController);

// Create a new kid
// - Parents create kids linked to their account
// - Admin/Staff can create kids for any parent
kidRouter.post('/', createKidController);

// Update a kid
// - Parents can only update their own kids
// - Admin/Staff can update any kid
kidRouter.put('/:id', updateKidController);

// Delete a kid
// - Parents can only delete their own kids
// - Admin/Staff can delete any kid
kidRouter.delete('/:id', deleteKidController);


// Add a kid to a school
kidRouter.post('/:kidId/school/:schoolId', addKidToSchoolController);

// Remove a kid from a school
kidRouter.delete('/:kidId/school/:schoolId', removeKidFromSchoolController);

// Update all schools for a kid
kidRouter.put('/:kidId/schools', updateKidSchoolsController);


export default kidRouter;
