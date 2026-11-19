This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Supabase connection

The app uses `@supabase/ssr` to create separate browser and server clients.

1. Copy `.env.example` to `.env.local`.
2. Start the local Supabase stack from the repository root with `supabase start`.
3. Copy the API URL and publishable key shown by `supabase status` into `.env.local`. If your local CLI only displays the legacy anon key, use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead.
4. Restart the Next.js development server after changing environment variables.

Use `createSupabaseBrowserClient()` in Client Components and `await createSupabaseServerClient()` in Server Components, Route Handlers, and Server Actions. Do not expose a `service_role` or secret key to the browser.

This setup only provides the Supabase clients; it does not add a Supabase Auth flow. Pepsi Plans' temporary, room-scoped visitor identity will be implemented separately according to the product specification.
