import express, { type NextFunction, type Response, type Request } from "express";
import { sqlQuery } from "../databases/sql-db";
import { type ProgrammingLangugage } from "../models/sql/ProgrammingLangugage";
export const languagesRouter = express.Router();

// CRUD: READ
languagesRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await sqlQuery(`
      SELECT *
      FROM programming_language
    `);
    const response = { data: rows };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// CRUD: READ
languagesRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const rows = await sqlQuery(`
      SELECT *
      FROM programming_language
      WHERE id=${id}
    `);

    if (rows?.[0]) {
      const response = { data: rows?.[0] };
      res.json(response);
    } else {
      res.status(404).json({ error: "Languange not found" });
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: CREATE
languagesRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, releasedYear, githutRank, pyplRank, tiobeRank } = req.body as ProgrammingLangugage

    const query: string = `
      INSERT INTO programming_languages (name, released_year, githut_rank, pypl_rank, tiobe_rank)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [name, releasedYear, githutRank, pyplRank, tiobeRank];

    const result = await sqlQuery(query, params);

    if (result) {
      return res.status(201).json({});
    } else {
      return res.status(500).json({ error: "Language not created" });
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: DELETE
languagesRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    await sqlQuery(`
      DELETE FROM programming_languages
      WHERE id = ${id}
    `);

    res.json({ message: "Language deleted!" });
  } catch (error) {
    next(error);
  }
});

// CRUD: UPDATE
languagesRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const { name, releasedYear, githutRank, pyplRank, tiobeRank } = req.body as ProgrammingLangugage;

    const query = `
      UPDATE programming_languages
      SET name = ?, released_year = ?, githut_rank = ?, pypl_rank = ?, tiobe_rank = ?
      WHERE id = ?
    `;
    const params = [name, releasedYear, githutRank, pyplRank, tiobeRank, id];
    await sqlQuery(query, params);

    const rows = await sqlQuery(`
      SELECT *
      FROM programming_languages
      WHERE id=${id}
    `);

    if (rows?.[0]) {
      const response = { data: rows?.[0] };
      res.json(response);
    } else {
      res.status(404).json({ error: "Languange not found" });
    }
  } catch (error) {
    next(error);
  }
});
