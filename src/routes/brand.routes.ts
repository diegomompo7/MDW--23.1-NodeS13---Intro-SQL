import express, { type NextFunction, type Response, type Request } from "express";
import fs from "fs";
import multer from "multer";

// Modelos
import { Brand } from "../models/mongo/Brand";
const upload = multer({ dest: "public" });

export const brandRouter = express.Router();

// CRUD: READ
brandRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Asi leemos query params
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const brands = await Brand.find()
      .limit(limit)
      .skip((page - 1) * limit);

    // Num total de elementos
    const totalElements = await Brand.countDocuments();

    const response = {
      totalItems: totalElements,
      totalPages: Math.ceil(totalElements / limit),
      currentPage: page,
      data: brands
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// CRUD: READ
brandRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const brand = await Brand.findById(id);
    if (brand) {
      res.json(brand);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: Operación custom, no es CRUD
brandRouter.get("/name/:name", async (req: Request, res: Response, next: NextFunction) => {
  const brandName = req.params.name;

  try {
    const brand = await Brand.find({ name: new RegExp("^" + brandName.toLowerCase(), "i") });
    if (brand?.length) {
      res.json(brand);
    } else {
      res.status(404).json([]);
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: CREATE
brandRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brand = new Brand(req.body);
    const createdBrand = await brand.save();
    return res.status(201).json(createdBrand);
  } catch (error) {
    next(error);
  }
});

// CRUD: DELETE
brandRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const brandDeleted = await Brand.findByIdAndDelete(id);
    if (brandDeleted) {
      res.json(brandDeleted);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: UPDATE
brandRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const brandUpdated = await Brand.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (brandUpdated) {
      res.json(brandUpdated);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

brandRouter.post("/logo-upload", upload.single("logo"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Renombrado de la imagen
    const originalname = req.file?.originalname as string;
    const path = req.file?.path as string;
    const newPath = `${path}_${originalname}`;
    fs.renameSync(path, newPath);

    // Busqueda de la marca
    const brandId = req.body.brandId;
    const brand = await Brand.findById(brandId);

    if (brand) {
      brand.logoImage = newPath;
      await brand.save();
      res.json(brand);

      console.log("Marca modificada correctamente!");
    } else {
      fs.unlinkSync(newPath);
      res.status(404).send("Marca no encontrada");
    }
  } catch (error) {
    next(error);
  }
});
