import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { userSubscriptions } from "./db/schema";
import { eq } from "drizzle-orm";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const checkSubscription = async () => {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const _userSubscriptions = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId));

  const userSubscription = _userSubscriptions[0];

  if (!userSubscription?.stripeCurrentPeriodEnd) {
    return false;
  }

  const isValidSubscription =
    userSubscription.stripeSubscriptionId &&
    userSubscription.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

  return !!isValidSubscription;
};
