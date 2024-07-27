import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify } from "hono/jwt";
import { signupInput, signinInput } from "@abhinj/medium-common/dist/user";
const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const { success } = signupInput.safeParse(body);
  if (!success) {
    c.status(403);
    return c.json({
      message: "inputs are not correct",
    });
  }
  try {
    const user = await prisma.users.create({
      data: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
    });
    const payload = {
      id: user.id,
      email: body.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    };
    const token = await sign(payload, c.env.JWT_SECRET);
    return c.json({ token });
  } catch (e: unknown) {
    return c.json({ e });
  }
});

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const { success } = signinInput.safeParse(body);
  if (!success) {
    c.status(403);
    return c.json({
      message: "inputs are not correct",
    });
  }
  try {
    const user = await prisma.users.findUnique({
      where: {
        email: body.email,
      },
    });
    if (!user) {
      c.status(403);
      return c.json({ error: "user not found" });
    }
    const payload = {
      id: user.id,
      email: body.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    };
    const token = await sign(payload, c.env.JWT_SECRET);
    return c.json({ token });
  } catch (e: unknown) {
    return c.json({ e });
  }
});

export default userRouter;
