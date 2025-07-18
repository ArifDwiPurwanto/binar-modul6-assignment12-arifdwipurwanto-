import bcrypt from "bcrypt";

// Best practice: using bcrypt for secure password hashing
export async function hashPassword(password: string): Promise<string> {
  console.time("Password Hashing");
  try {
    // Using bcrypt with salt rounds of 12 for good security/performance balance
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    console.timeEnd("Password Hashing");
    return hash;
  } catch (error) {
    console.error("Password hashing error:", error);
    console.timeEnd("Password Hashing");
    throw error;
  }
}

// Best practice: using bcrypt.compare for secure password verification
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  console.time("Password Comparison");
  try {
    const isValid = await bcrypt.compare(password, hash);
    console.timeEnd("Password Comparison");
    return isValid;
  } catch (error) {
    console.error("Password comparison error:", error);
    console.timeEnd("Password Comparison");
    return false;
  }
}
