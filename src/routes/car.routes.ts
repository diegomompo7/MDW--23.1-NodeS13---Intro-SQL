import express, { type NextFunction, type Response, type Request } from "express";

// Modelos
import { Car } from "../models/mongo/Car";

// Router propio de usuarios
export const carRouter = express.Router();

// CRUD: READ
carRouter.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Estamos en el middleware /car que comprueba parámetros");

    const page: number = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      req.query.page = page as any;
      req.query.limit = limit as any;
      next();
    } else {
      console.log("Parámetros no válidos:");
      console.log(JSON.stringify(req.query));
      res.status(400).json({ error: "Params page or limit are not valid" });
    }
  } catch (error) {
    next(error);
  }
});

carRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Asi leemos query params
    const page: number = req.query.page as any;
    const limit: number = req.query.limit as any;

    const cars = await Car.find()
      .limit(limit)
      .skip((page - 1) * limit)
      .populate(["owner", "brand"]);

    // Num total de elementos
    const totalElements = await Car.countDocuments();

    const response = {
      totalItems: totalElements,
      totalPages: Math.ceil(totalElements / limit),
      currentPage: page,
      data: cars
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// CRUD: READ
carRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const car = await Car.findById(id).populate(["owner", "brand"]);
    if (car) {
      res.json(car);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: Operación custom, no es CRUD
carRouter.get("/brand/:brand", async (req: Request, res: Response, next: NextFunction) => {
  const brand = req.params.brand;

  try {
    const car = await Car.find({ brand: new RegExp("^" + brand.toLowerCase(), "i") }).populate(["owner", "brand"]);
    if (car?.length) {
      res.json(car);
    } else {
      res.status(404).json([]);
    }
  } catch (error) {
    next(error);
  }
});

// Endpoint de creación de usuarios
// CRUD: CREATE
carRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const car = new Car(req.body);
    const createdCar = await car.save();
    return res.status(201).json(createdCar);
  } catch (error) {
    next(error);
  }
});

// Para elimnar coches
// CRUD: DELETE
carRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const carDeleted = await Car.findByIdAndDelete(id);
    if (carDeleted) {
      res.json(carDeleted);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: UPDATE
carRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const carUpdated = await Car.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (carUpdated) {
      res.json(carUpdated);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});
