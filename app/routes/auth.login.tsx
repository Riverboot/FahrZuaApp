import {
      Form,
      Link,
      useActionData,
      useNavigation,
      useSearchParams,
    } from "@remix-run/react";
    import { json, redirect, type ActionFunction } from "@remix-run/node";
    import { login } from "~/utils/auth.server";

    export const action: ActionFunction = async ({ request }) => {
      const form = await request.formData();
      const email = String(form.get("email"));
      const password = String(form.get("password"));
      const submission = await login({ email, password });
      if (submission?.errors) {
        return json(submission);
      }
      return redirect("/");
    };

    export default function Login() {
      const actionData = useActionData<typeof action>();
      const navigation = useNavigation();
      const [searchParams] = useSearchParams();
      const redirectTo = searchParams.get("redirectTo") || "/";

      const isSubmitting = navigation.state === "submitting";

      return (
        <div className="container mx-auto flex min-h-screen items-center justify-center">
          <Form
            method="post"
            className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-8"
          >
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {actionData?.errors?.email ? (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  {actionData.errors.email}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {actionData?.errors?.password ? (
                <p className="mt-2 text-sm text-red-600" id="password-error">
                  {actionData.errors.password}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
            <div className="text-sm">
              Noch kein Konto?{" "}
              <Link to={`/auth/register?redirectTo=${redirectTo}`} className="underline">
                Registrieren
              </Link>
            </div>
          </Form>
        </div>
      );
    }
