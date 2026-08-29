"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(prevState: { error: string } | null, formData: FormData) {
  const username = formData.get("username");
  const password = formData.get("password");

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const cookieStore = await cookies();
    cookieStore.set("auth_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    
    redirect("/dashboard");
  }

  return { error: "Invalid username or password" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}
