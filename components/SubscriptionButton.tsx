"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import axios from "axios";

type Props = {
  isPro?: boolean;
};

const SubscriptionButton = ({ isPro }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubsciption = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/stripe");
      const { url } = await response.data;

      window.location.href = url;
    } catch (error) {
      console.error("Error in subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Button
      className="w-full text-white bg-primary hover:bg-primary/90 py-6 font-semibold text-sm"
      onClick={handleSubsciption}
      disabled={isLoading}
    >
      {isPro ? "Manage Subscription" : "Upgrade to Pro"}
    </Button>
  );
};

export default SubscriptionButton;
