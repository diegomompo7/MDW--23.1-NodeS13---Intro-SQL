import { type ICar } from "./Car";
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
const Schema = mongoose.Schema;

export interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    street: string;
    number: number;
    city: string;
  };
  cars?: ICar[];
}

// Creamos el schema del usuario
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      validate: {
        validator: (text: string) => validator.isEmail(text),
        message: "Email incorrecto"
      }
    },
    password: {
      type: String,
      trim: true,
      required: true,
      minLength: [8, "La contraseña debe tener al menos 8 caracteres"],
      select: false
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 45
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 45
    },
    phone: {
      type: String,
      required: false,
      trim: true
    },
    address: {
      type: {
        street: {
          type: String,
          required: true,
          trim: true
        },
        number: {
          type: Number,
          required: true
        },
        city: {
          type: String,
          required: true,
          trim: true
        }
      },
      required: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function (next) {
  try {
    // Si la contraseña ya estaba encriptada, no la encriptamos de nuevo
    if (this.isModified("password")) {
      const saltRounds = 10;
      const passwordEncrypted = await bcrypt.hash(this.password, saltRounds);
      this.password = passwordEncrypted;
    }

    next();
  } catch (error: any) {
    next(error);
  }
});

export const User = mongoose.model<IUser>("User", userSchema);
