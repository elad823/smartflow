import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateIssueRequest, GetIssueParams, ListIssuesQuery } from '../types/issue.types';
import { IssueService, issueService } from '../services/issue.service';

export class IssueController {
  constructor(private readonly service: IssueService = issueService) {}

  public createIssue = async (
    request: FastifyRequest<{ Body: CreateIssueRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const issue = await this.service.createIssue(request.body);
    reply.status(201).send(issue);
  };

  public listIssues = async (
    request: FastifyRequest<{ Querystring: ListIssuesQuery }>,
    reply: FastifyReply
  ): Promise<void> => {
    const response = await this.service.listIssues(request.query);
    reply.status(200).send(response);
  };

  public getIssueById = async (
    request: FastifyRequest<{ Params: GetIssueParams }>,
    reply: FastifyReply
  ): Promise<void> => {
    const issue = await this.service.getIssueById(request.params.id);
    reply.status(200).send(issue);
  };
}

export const issueController = new IssueController();
