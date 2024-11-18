import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const _userSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (_userSubscriptions[0] && _userSubscriptions[0].stripeSubscriptionId) {
      // Try to cancel the subscription
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: _userSubscriptions[0].stripeCustomerId,
        return_url: process.env.NEXT_PUBLIC_URL,
      });
      return NextResponse.json({ url: stripeSession.url });
    }

    // User first time subscription
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: process.env.NEXT_PUBLIC_URL,
      cancel_url: process.env.NEXT_PUBLIC_URL,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user?.emailAddresses[0].emailAddress,
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "Cumentor Pro",
              description: "Access to Cumentor Pro features",
            },
            unit_amount: 2000, // 20 USD
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.log(
      "[STRIPE_ERROR]",
      error instanceof Error ? error.message : error
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
