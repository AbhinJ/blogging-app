import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { createBlog, updateBlog } from "@abhinj/medium-common/dist/blog";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  try {
    let token = c.req.header("authorization") || "";
    token = token.split(" ")[1];
    const response = await verify(token, c.env.JWT_SECRET);
    const id = <string>response.id;
    if (response) {
      c.set("userId", id);
      await next();
    } else {
      c.status(403);
      return c.json({ error: "unauthorised" });
    }
  } catch (e) {
    c.status(403);
    return c.json({
      message: "You are not logged in",
    });
  }
});

// TODO: ADD pagination
blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const blog = await prisma.post.findMany({});
    return c.json({ blog });
  } catch (e: unknown) {
    c.status(401);
    c.json({ message: e });
  }
});

blogRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const blog = await prisma.post.findFirst({
      where: {
        id,
      },
    });
    console.log(blog);
    return c.json({ blog });
  } catch (e: unknown) {
    c.status(401);
    c.json({ message: e });
  }
});

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const { success } = createBlog.safeParse(body);
  if (!success) {
    c.status(403);
    return c.json({
      message: "Incorrect Inputs",
    });
  }
  try {
    const blog = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: c.get("userId"),
      },
    });
    return c.json({
      id: blog.id,
    });
  } catch (e: unknown) {
    c.status(401);
    c.json({ e });
  }
});

blogRouter.put("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const { success } = updateBlog.safeParse(body);
  if (!success) {
    c.status(403);
    return c.json({
      message: "Incorrect Inputs",
    });
  }
  try {
    const blog = await prisma.post.update({
      where: {
        id: body.id,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });
    return c.json({
      id: blog.id,
    });
  } catch (e: unknown) {
    c.status(401);
    c.json({ e });
  }
});
