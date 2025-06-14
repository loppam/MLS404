import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

export default function FeePayment() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fees, setFees] = useState([]);
  const [selectedFee, setSelectedFee] = useState("");
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchFees();
    // Load Paystack script
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to fetch user data");
    }
  };

  const fetchFees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "fees"));
      const feesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFees(feesList);
      if (feesList.length === 0) {
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching fees:", error);
      setError("Failed to fetch fees");
    } finally {
      setLoading(false);
    }
  };

  const selectedFeeData = fees.find((fee) => fee.id === selectedFee);

  const verifyPayment = async (reference) => {
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const data = await response.json();
      console.log("Payment verification response:", data);

      if (data.status && data.data.status === "success") {
        return data.data; // Return the full transaction data
      }
      return false;
    } catch (error) {
      console.error("Error verifying payment:", error);
      return false;
    }
  };

  const handlePayment = async () => {
    if (!selectedFeeData) return;

    setError("");
    setProcessingPayment(true);

    try {
      // Generate a unique reference
      const reference = `FEE-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Initialize Paystack
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: currentUser.email,
        amount: selectedFeeData.amount * 100,
        currency: "NGN",
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Student Name",
              variable_name: "student_name",
              value: userData?.name || "",
            },
            {
              display_name: "Fee Type",
              variable_name: "fee_type",
              value: selectedFeeData?.name || "",
            },
            {
              display_name: "Student ID",
              variable_name: "student_id",
              value: currentUser.uid,
            },
          ],
        },
        callback: function (response) {
          const verifyAndProcess = async () => {
            try {
              setVerifying(true);
              console.log("Payment callback received:", response);

              // Verify the payment
              const paymentData = await verifyPayment(response.reference);

              if (!paymentData) {
                throw new Error("Payment verification failed");
              }

              // Prepare payment record data
              const paymentRecord = {
                studentId: currentUser.uid,
                studentName: userData?.name || "",
                feeId: selectedFee,
                feeName: selectedFeeData?.name || "",
                amount: selectedFeeData?.amount,
                reference: response.reference,
                status: "success",
                paymentDate: serverTimestamp(),
                paymentMethod: "paystack",
                transactionId: paymentData.id || response.transaction,
                metadata: {
                  student_id: currentUser.uid,
                  fee_id: selectedFee,
                  student_name: userData?.name || "",
                  fee_type: selectedFeeData?.name || "",
                },
                createdAt: serverTimestamp(),
              };

              // Add optional fields only if they exist
              if (paymentData.receipt_url) {
                paymentRecord.receiptUrl = paymentData.receipt_url;
              }

              if (paymentData.authorization) {
                paymentRecord.authorization = {
                  authorization_code:
                    paymentData.authorization.authorization_code || null,
                  card_type: paymentData.authorization.card_type || null,
                  last4: paymentData.authorization.last4 || null,
                  bank: paymentData.authorization.bank || null,
                  channel: paymentData.authorization.channel || null,
                };
              }

              // Create payment record in Firestore
              const paymentRef = await addDoc(
                collection(db, "payments"),
                paymentRecord
              );
              console.log("Payment record created with ID:", paymentRef.id);

              // Prepare student fee update data
              const feeUpdate = {
                [`fees.${selectedFee}.status`]: "paid",
                [`fees.${selectedFee}.paymentDate`]: serverTimestamp(),
                [`fees.${selectedFee}.reference`]: response.reference,
                [`fees.${selectedFee}.lastUpdated`]: serverTimestamp(),
              };

              // Add optional fields only if they exist
              if (paymentData.id) {
                feeUpdate[`fees.${selectedFee}.transactionId`] = paymentData.id;
              }
              if (paymentData.receipt_url) {
                feeUpdate[`fees.${selectedFee}.receiptUrl`] =
                  paymentData.receipt_url;
              }

              // Update student's fee status
              const studentRef = doc(db, "users", currentUser.uid);
              await updateDoc(studentRef, feeUpdate);
              console.log("Student fee status updated successfully");

              setSuccess(
                "Payment successful! Your receipt has been generated."
              );
              setSelectedFee("");

              // Redirect to receipts page after 3 seconds
              setTimeout(() => {
                navigate("/student/receipts");
              }, 3000);
            } catch (error) {
              console.error("Error processing payment:", error);
              setError("Error processing payment. Please contact support.");
            } finally {
              setVerifying(false);
              setProcessingPayment(false);
            }
          };

          verifyAndProcess();
        },
        onClose: function () {
          console.log("Payment modal closed");
          setProcessingPayment(false);
        },
      });

      handler.openIframe();
    } catch (error) {
      console.error("Payment initialization error:", error);
      setError("Failed to initialize payment. Please try again.");
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-b-2 border-indigo-600"
        ></motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold mb-6"
          >
            Fee Payment
          </motion.h2>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-100 text-red-700 rounded-md"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-100 text-green-700 rounded-md"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow rounded-lg p-6"
          >
            <div className="space-y-6">
              <div>
                <label htmlFor="fee" className="form-label">
                  Select Fee
                </label>
                <select
                  id="fee"
                  value={selectedFee}
                  onChange={(e) => setSelectedFee(e.target.value)}
                  className="input-field"
                  required
                  disabled={processingPayment}
                >
                  <option value="">Select a fee</option>
                  {fees.map((fee) => (
                    <option key={fee.id} value={fee.id}>
                      {fee.name} - ₦{fee.amount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFeeData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-50 p-4 rounded-md"
                >
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedFeeData.name}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {selectedFeeData.description}
                  </p>
                  <p className="mt-2 text-xl font-bold text-indigo-600">
                    Amount: ₦{selectedFeeData.amount.toLocaleString()}
                  </p>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={!selectedFee || processingPayment || verifying}
                className={`btn-primary w-full ${
                  !selectedFee || processingPayment || verifying
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {processingPayment
                  ? "Processing Payment..."
                  : verifying
                  ? "Verifying Payment..."
                  : "Pay Now"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4"
                >
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </motion.div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Fee Payment Not Available
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  School fees have not been set up yet. Please check back later
                  or contact the administration for more information.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowModal(false);
                    navigate("/dashboard");
                  }}
                  className="btn-primary"
                >
                  Return to Dashboard
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
