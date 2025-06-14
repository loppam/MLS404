// Paystack configuration
export const paystackConfig = {
  reference: new Date().getTime().toString(),
  email: "", // Will be set dynamically
  amount: 0, // Will be set dynamically
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  currency: "NGN",
  channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
  metadata: {
    custom_fields: [], // Will be set dynamically
  },
};

// Function to initialize payment
export const initializePayment = async (config) => {
  try {
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      }
    );

    const data = await response.json();
    if (!data.status) {
      throw new Error(data.message || "Failed to initialize payment");
    }
    return data;
  } catch (error) {
    console.error("Payment initialization error:", error);
    throw error;
  }
};

// Function to verify payment
export const verifyPayment = async (reference) => {
  console.log("Starting payment verification for reference:", reference);
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();
    console.log("Paystack verification response:", data);

    if (!data.status) {
      console.error("Paystack verification failed:", data.message);
      throw new Error(data.message || "Payment verification failed");
    }

    if (data.data.status !== "success") {
      console.error("Payment not successful:", data.data.status);
      throw new Error(`Payment status: ${data.data.status}`);
    }

    return data;
  } catch (error) {
    console.error("Payment verification error:", error);
    throw error;
  }
};
