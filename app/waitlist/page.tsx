"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { Navbar } from "@/components/layout/navbar";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    // Simulate API call registration logic here
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <section className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-8 md:py-10 bg-white">
        <div className="inline-block max-w-3xl text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Join the <span className="text-[#FF3B3B]">movement</span>
          </h1>
          <p className="text-lg text-default-800 mt-4 max-w-2xl mx-auto">
            Get early access to Unite — the next-generation health tech platform built as a movement. One donation, infinite impact.
          </p>
        </div>

        <div className="mt-8 w-full max-w-md px-4">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <h3 className="text-2xl font-bold mt-4">You&apos;re on the list!</h3>
              <p className="text-default-800 text-center">
                Keep an eye on your inbox. We&apos;ll be in touch soon with updates.
              </p>
              <Button 
                as={Link}
                href="/"
                size="md" 
                variant="bordered"
                className="mt-4"
              >
                Return home
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
                <Input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="flex-1"
                  radius="md"
                  size="md"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if(status === 'error') setStatus('idle');
                  }}
                  isDisabled={status === "loading"}
                  required
                  aria-label="Email address"
                />
                <Button 
                  type="submit"
                  className="text-white"
                  color="danger"
                  radius="md"
                  size="md"
                  variant="solid"
                  isLoading={status === "loading"}
                >
                  {status === "loading" ? "Joining..." : "Waitlist"}
                </Button>
              </form>
              {status === "error" && (
                <p className="text-[#FF3B3B] text-sm mt-3 text-center">
                  {errorMessage}
                </p>
              )}
              
              <div className="mt-8 flex flex-col items-center">
                <p className="text-sm text-default-500 text-center">
                  Join 1,000+ others already waiting. No spam. Unsubscribe anytime.
                </p>
                <Button 
                  as={Link}
                  href="/about"
                  size="md" 
                  variant="bordered"
                  className="mt-6 text-slate-800 font-medium border-slate-300 hover:bg-slate-50"
                >
                  Learn more
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
