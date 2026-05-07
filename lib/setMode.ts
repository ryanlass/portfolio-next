"use server";

import { cookies } from "next/headers";
import type { Mode } from "./mapPath";

const COOKIE_NAME = "mode";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setMode(target: Mode): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, target, {
    path: "/",
    sameSite: "lax",
    maxAge: ONE_YEAR,
    httpOnly: false,
  });
}

export async function readMode(): Promise<Mode | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (value === "human" || value === "agent") return value;
  return null;
}
