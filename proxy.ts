import { NextResponse } from "next/server";

export default function proxy(_request: Request) {
  return NextResponse.next();
}

// Optional if you want matcher behavior like middleware had:
// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
// };
