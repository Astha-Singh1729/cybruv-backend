import Express from 'express';
export const params = async (req: Express.Request, res: Express.Response) => {
  res.send(req.params.name);
};
