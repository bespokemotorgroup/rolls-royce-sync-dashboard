export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-800/80 bg-neutral-900 p-8 shadow-xl shadow-black/40">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-bold text-neutral-900">
            RR
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-neutral-100">Content Sync</h1>
            <p className="text-xs leading-tight text-neutral-500">Admin dashboard</p>
          </div>
        </div>
        <p className="mb-6 text-sm text-neutral-400">
          Enter the shared password to continue.
        </p>
        <form action="/api/login" method="POST" className="space-y-4">
          <input type="hidden" name="from" value={from ?? "/"} />
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              placeholder="Password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 transition hover:bg-white"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
