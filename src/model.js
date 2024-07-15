import { model } from "mongoose";
import registerSchema from "./components/registerSchema.js";
import { tokenSchema } from "./components/tokenSchema.js";
// import rentSchema from "../rent/rentSchema.js";
// import registerSchema from "./registerSchema.js";

export let Register = model("register", registerSchema);
export let Token = model("Token", tokenSchema);
