import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (user && user.verified) {
    return user;
  }
  return null;
}

export async function getUserByEmail(email: User["email"]) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.verified) {
    return user;
  }
  return null;
}

export async function createUser(email: User["email"], password: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    auth: {
      user: "organism-0555@mail.ru",
      pass: "1DDkSgsJb6GnECVTd1hC",
    },
  });
  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = uuidv4();
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    user = await prisma.user.update({
      where: { email },
      data: { verificationToken },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email,
        password: {
          create: {
            hash: hashedPassword,
          },
        },
        verificationToken,
      },
    });
  }
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? `http://localhost:${process.env.PORT || 3000}`
      : `https://organism-0555-staging.fly.dev`;
  const link = `${baseUrl}/verify?email=${email}&verificationToken=${verificationToken}`;
  await transporter.sendMail({
    from: `"Organism" <organism-0555@mail.ru>`,
    to: email,
    subject: "Confirm your email ✔",
    html: `<p>You've received a confirmation link for your new account at Organism.</p>
    <p>To confirm your account, follow this link: <a href=${link}>${link}</p>`,
  });
  return user;
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  if (
    !userWithPassword ||
    !userWithPassword.password ||
    !userWithPassword.verified
  ) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
