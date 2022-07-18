import { Request, Response, NextFunction } from "express";

const errorHandle = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // console.error(err.stack)
  res.send(err);
};

export default errorHandle;