import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import BackButton from "../components/BackButton";

export default function StaffProfile() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [staffData, setStaffData] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    averageClassSize: 0,
  });

  const fetchStaffData = useCallback(async () => {
    try {
      const staffDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (staffDoc.exists()) {
        setStaffData(staffDoc.data());
      }
    } catch (error) {
      console.error("Error fetching staff data:", error);
      setError("Failed to fetch staff information");
    }
  }, [currentUser]);

  const fetchClasses = useCallback(async () => {
    try {
      const classesQuery = query(
        collection(db, "classes"),
        where("teacherId", "==", currentUser.uid)
      );
      const classesSnapshot = await getDocs(classesQuery);
      const classesData = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesData);
      setStats((prev) => ({ ...prev, activeClasses: classesData.length }));
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError("Failed to fetch classes");
    }
  }, [currentUser]);

  const fetchStudents = useCallback(async () => {
    try {
      let totalStudents = 0;
      for (const classItem of classes) {
        const studentsQuery = query(
          collection(db, "users"),
          where("role", "==", "student"),
          where("classId", "==", classItem.id)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        totalStudents += studentsSnapshot.size;
      }
      const averageClassSize =
        classes.length > 0 ? totalStudents / classes.length : 0;
      setStats((prev) => ({
        ...prev,
        totalStudents,
        averageClassSize: Math.round(averageClassSize * 10) / 10,
      }));
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  }, [classes]);

  useEffect(() => {
    fetchStaffData();
    fetchClasses();
  }, [fetchStaffData, fetchClasses]);

  useEffect(() => {
    if (classes.length > 0) {
      fetchStudents();
    } else {
      setLoading(false);
    }
  }, [classes, fetchStudents]);

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />

        <div className="mt-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900">
                Staff Profile
              </h1>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-indigo-900">
                    Total Students
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-indigo-600">
                    {stats.totalStudents}
                  </p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-green-900">
                    Active Classes
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {stats.activeClasses}
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900">
                    Avg. Class Size
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {stats.averageClassSize}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Staff Information
                  </h2>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Staff ID
                        </p>
                        <p className="mt-1 text-lg text-gray-900">
                          {staffData?.staffId || "Not assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Name
                        </p>
                        <p className="mt-1 text-lg text-gray-900">
                          {staffData?.name || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Email
                        </p>
                        <p className="mt-1 text-lg text-gray-900">
                          {currentUser.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Department
                        </p>
                        <p className="mt-1 text-lg text-gray-900">
                          {staffData?.department || "Not assigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
