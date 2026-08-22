import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import { overviewService } from '../services/overview.service';
import { CreateProjectInput, UpdateProjectInput } from '../validators/project.schema';
import { UnauthorizedError } from '../middleware/error.middleware';
function requireAccountId(req: Request): string {
  if (!req.accountId) throw new UnauthorizedError();
  return req.accountId;
}
export const projectController = {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const data = await overviewService.getOverview(accountId);
      res.status(200).json(data);
    } catch (err) { next(err); }
  },
  async listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const projects = await projectService.listProjects(accountId);
      res.status(200).json({ projects });
    } catch (err) { next(err); }
  },
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const input = req.body as CreateProjectInput;
      const project = await projectService.createProject(accountId, input);
      res.status(201).json({ project });
    } catch (err) { next(err); }
  },
  async getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const { id } = req.params;
      const project = await projectService.getProject(id, accountId);
      res.status(200).json({ project });
    } catch (err) { next(err); }
  },
  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const { id } = req.params;
      const input = req.body as UpdateProjectInput;
      const project = await projectService.updateProject(id, accountId, input);
      res.status(200).json({ project });
    } catch (err) { next(err); }
  },
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const { id } = req.params;
      await projectService.deleteProject(id, accountId);
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
