import express, { type NextFunction, type Response, type Request } from "express";
import bcrypt from "bcrypt";
// import { generateToken } from "../utils/token";

// Modelos
import { User } from "../models/mongo/User";
import { Car } from "../models/mongo/Car";
import { generateToken } from "../utils/token";
import { isAuth } from "../middlewares/auth.middleware";

// Router propio de usuarios
export const userRouter = express.Router();

// CRUD: READ
// EJEMPLO DE REQ: http://localhost:3000/user?page=1&limit=10
userRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ternario que se queda con el parametro si llega
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const users = await User.find()
      .limit(limit)
      .skip((page - 1) * limit);

    // Num total de elementos
    const totalElements = await User.countDocuments();

    const response = {
      totalItems: totalElements,
      totalPages: Math.ceil(totalElements / limit),
      currentPage: page,
      data: users
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// CRUD: READ
userRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select("+password");

    if (user) {
      const temporalUser = user.toObject();
      const includeCars = req.query.includeCars === "true";
      if (includeCars) {
        const cars = await Car.find({ owner: id });
        temporalUser.cars = cars;
      }

      res.json(temporalUser);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: Operación custom, no es CRUD
userRouter.get("/name/:name", async (req: Request, res: Response, next: NextFunction) => {
  const name = req.params.name;

  try {
    const user = await User.find({ firstName: new RegExp("^" + name.toLowerCase(), "i") });
    if (user?.length) {
      res.json(user);
    } else {
      res.status(404).json([]);
    }
  } catch (error) {
    next(error);
  }
});

// Endpoint de creación de usuarios
// CRUD: CREATE
userRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = new User(req.body);
    const createdUser = await user.save();
    return res.status(201).json(createdUser);
  } catch (error) {
    next(error);
  }
});

// Para elimnar usuarios
// CRUD: DELETE
userRouter.delete("/:id", isAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    if (req.user.id !== id && req.user.email !== "admin@gmail.com") {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }

    const userDeleted = await User.findByIdAndDelete(id);
    if (userDeleted) {
      res.json(userDeleted);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: UPDATE
userRouter.put("/:id", isAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    if (req.user.id !== id && req.user.email !== "admin@gmail.com") {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }

    const userToUpdate = await User.findById(id);
    if (userToUpdate) {
      Object.assign(userToUpdate, req.body);
      await userToUpdate.save();
      // Quitamos pass de la respuesta
      const userToSend: any = userToUpdate.toObject();
      delete userToSend.password;
      res.json(userToSend);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

// LOGIN DE USUARIOS
userRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const email = req.body.email;
    // const password = req.body.password;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Se deben especificar los campos email y password" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      // return res.status(404).json({ error: "No existe un usuario con ese email" });
      // Por seguridad mejor no indicar qué usuarios no existen
      return res.status(401).json({ error: "Email y/o contraseña incorrectos" });
    }

    // Comprueba la pass
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      // Quitamos password de la respuesta
      const userWithoutPass: any = user.toObject();
      delete userWithoutPass.password;

      // Generamos token JWT
      const jwtToken = generateToken(user._id.toString(), user.email);

      return res.status(200).json({ token: jwtToken });
    } else {
      return res.status(401).json({ error: "Email y/o contraseña incorrectos" });
    }
  } catch (error) {
    next(error);
  }
});
