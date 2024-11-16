"use client";
import React from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

type Props = {
  children: React.ReactNode;
};

const query = new QueryClient();

const Providers = ({ children }: Props) => {
  return <QueryClientProvider client={query}>{children}</QueryClientProvider>;
};

export default Providers;
