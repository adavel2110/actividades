export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/incidents/:path*",
    "/categories/:path*",
    "/users/:path*",
    "/roles/:path*",
    "/profile/:path*",
  ],
};
