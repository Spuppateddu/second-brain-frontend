"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEventHandler, useEffect, useState } from "react";

import Checkbox from "@/components/Checkbox";
import { Button, Input } from "@/components/UI";
import GuestLayout from "@/components/GuestLayout";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [statusMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/calendar");
    }
  }, [status, router]);

  const submit: FormEventHandler = async (e) => {
    e.preventDefault();
    setErrors({});
    setProcessing(true);
    try {
      await login({ email, password });
      router.replace("/calendar");
    } catch (err: unknown) {
      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
              errors?: Record<string, string[] | string>;
            };
          };
        }
      )?.response?.data;
      const fieldErrors = response?.errors;
      if (fieldErrors) {
        setErrors({
          email: Array.isArray(fieldErrors.email)
            ? fieldErrors.email[0]
            : (fieldErrors.email as string | undefined),
          password: Array.isArray(fieldErrors.password)
            ? fieldErrors.password[0]
            : (fieldErrors.password as string | undefined),
        });
      } else {
        setErrors({
          email: response?.message ?? "Login failed. Check your credentials.",
        });
      }
      setPassword("");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <GuestLayout>
      {statusMessage && (
        <div className="mb-4 text-sm font-medium text-green-600">
          {statusMessage}
        </div>
      )}

      <form onSubmit={submit}>
        <div>
          <Input
            id="email"
            type="email"
            name="email"
            label="Email"
            value={email}
            className="block w-full"
            autoComplete="username"
            isFocused={true}
            error={errors.email}
            fullWidth
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <Input
            id="password"
            type="password"
            name="password"
            label="Password"
            value={password}
            className="block w-full"
            autoComplete="current-password"
            error={errors.password}
            fullWidth
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mt-4 block">
          <label className="flex items-center">
            <Checkbox
              name="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="ms-2 text-sm text-gray-600">Remember me</span>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Forgot your password?
          </Link>

          <Button variant="primary" className="ms-4" disabled={processing}>
            Log in
          </Button>
        </div>
      </form>
    </GuestLayout>
  );
}
