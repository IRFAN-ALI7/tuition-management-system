
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.model";

const ADMIN = {
  name: "Wakeel Ansari",
  mobile: "9523005636",
  email: "ali78692irfan@gmail.com",
  password: "Wakeel@123",
};

async function createInitialAdmin() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required in backend/.env");
  }

  if (
    ADMIN.password.length < 8 ||
    Buffer.byteLength(ADMIN.password, "utf8") > 72
  ) {
    throw new Error("Admin password length is invalid.");
  }

  await mongoose.connect(MONGODB_URI);

  const email = ADMIN.email.trim().toLowerCase();

  const existingAdmin = await User.findOne({
    role: "admin",
    email,
  });

  if (existingAdmin) {
    existingAdmin.name = ADMIN.name;
    existingAdmin.mobile = ADMIN.mobile;
    existingAdmin.emailVerified = true;

    // Preserve the existing password.
    await existingAdmin.save();

    console.log("Admin already exists. Profile updated; password preserved.");
    return;
  }

  const anotherAdmin = await User.exists({ role: "admin" });

  if (anotherAdmin) {
    throw new Error(
      "Another admin already exists. No account was created or changed."
    );
  }

  const passwordHash = await bcrypt.hash(ADMIN.password, 12);

  await User.create({
    name: ADMIN.name,
    mobile: ADMIN.mobile,
    email,
    passwordHash,
    role: "admin",
    emailVerified: true,
  });

  console.log("Initial Admin created successfully.");
}

createInitialAdmin()
  .catch((error: unknown) => {
    console.error("Could not create initial Admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
