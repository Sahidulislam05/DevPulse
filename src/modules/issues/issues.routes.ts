import { Router } from 'express';
import {
  createIssue, getAllIssues, getIssueById, updateIssue, deleteIssue
} from './issues.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireMaintainer } from '../../middleware/authorize';

const router = Router();

router.get('/', getAllIssues);
router.get('/:id', getIssueById);
router.post('/', authenticate, createIssue);
router.patch('/:id', authenticate, updateIssue);
router.delete('/:id', authenticate, requireMaintainer, deleteIssue);

export default router;