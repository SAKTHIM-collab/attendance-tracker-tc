import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';

import {
  User,
  Mail,
  Lock,
  Calendar,
  Book,
  MapPin,
  Percent,
  Bell,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Clock,
  Plus,
  Minus,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  LogOut,
  BarChart2,
  CalendarDays,
  ListFilter,
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyCyNKHNk0l4TWAgxqAF9aE-OOyypQ3fe4w",
  authDomain: "mapw-5bc07.firebaseapp.com",
  projectId: "mapw-5bc07",
  storageBucket: "mapw-5bc07.firebasestorage.app",
  messagingSenderId: "464153680471",
  appId: "1:464153680471:web:e0bfa3773516112ee5e112",
  measurementId: "G-ESBDMJ0L6E"
};

const appId = firebaseConfig.appId;
const initialAuthToken = null;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext(null);
const DataContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setUserId(user.uid);
      } else {
        setCurrentUser(null);
        setUserId(null);
        try {
          await signInAnonymously(auth);
        } catch (anonError) {
          console.error('Error signing in anonymously:', anonError);
        }
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userId, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

const DataProvider = ({ children }) => {
  const { userId, loadingAuth } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [minAttendancePercent, setMinAttendancePercent] = useState(75);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loadingAuth && userId) {
      const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/userData/profile`);

      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSubjects(data.subjects || []);
          setSchedule(data.schedule || []);
          setMinAttendancePercent(data.minAttendancePercent || 75);
          setAttendanceRecords(data.attendanceRecords || {});
        } else {
          setDoc(userDocRef, {
            subjects: [],
            schedule: [],
            minAttendancePercent: 75,
            attendanceRecords: {},
          }, { merge: true }).catch(console.error);
        }
        setLoadingData(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setLoadingData(false);
      });

      return () => unsubscribe();
    } else if (!loadingAuth && !userId) {
      setSubjects([]);
      setSchedule([]);
      setMinAttendancePercent(75);
      setAttendanceRecords({});
      setLoadingData(false);
    }
  }, [userId, loadingAuth]);

  const updateUserData = useCallback(async (data) => {
    if (!userId) {
      console.error("User not authenticated. Cannot update data.");
      return;
    }
    const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/userData/profile`);
    try {
      await updateDoc(userDocRef, data);
      console.log("User data updated successfully!");
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  }, [userId]);

  const value = {
    subjects,
    setSubjects,
    schedule,
    setSchedule,
    minAttendancePercent,
    setMinAttendancePercent,
    attendanceRecords,
    setAttendanceRecords,
    updateUserData,
    loadingData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);
const useData = () => useContext(DataContext);

const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c;
  return d;
};

const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-500' :
                  type === 'warning' ? 'bg-yellow-500' :
                  type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const Icon = type === 'success' ? CheckCircle :
               type === 'warning' ? AlertTriangle :
               type === 'error' ? XCircle : Info;

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white flex items-center space-x-3 z-50 ${bgColor}`}>
      <Icon size={24} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
        &times;
      </button>
    </div>
  );
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const { loadingAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage('Logged in successfully!');
        setMessageType('success');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage('Account created successfully!');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Auth error:', error.message);
      setMessage(error.message);
      setMessageType('error');
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-700 dark:text-gray-300">Loading authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-8">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
        <Notification message={message} type={messageType} onClose={() => setMessage('')} />
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { userId } = useAuth();
  const { schedule, attendanceRecords, minAttendancePercent, updateUserData } = useData();
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const getCurrentLocation = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation is not supported by your browser');
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => {
            reject(`Geolocation error: ${error.message}`);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    });
  };

  const getGoMapsProLocation = async (wifiAccessPoints, cellTowers) => {
    const apiKey = 'YOUR_GOMAPS_PRO_API_KEY';
    const apiUrl = `https://www.gomaps.pro/geolocation/v1/geolocate?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          considerIp: "false",
          wifiAccessPoints: wifiAccessPoints || [],
          cellTowers: cellTowers || [],
        }),
      });
      if (!response.ok) {
        throw new Error(`GoMaps Pro API error: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error calling GoMaps Pro API:", error);
      setNotification({ message: `GoMaps Pro API error: ${error.message}`, type: 'error' });
      return null;
    }
  };

  const checkAndMarkAttendance = useCallback(async () => {
    if (!userId || !schedule.length) return;

    const today = new Date();
    const todayDayName = getDayName(today);
    const todayDateString = getTodayDateString();

    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const todaySchedule = schedule.find(s => s.day === todayDayName);

    if (!todaySchedule || !todaySchedule.slots.length) return;

    let userLocation = null;
    try {
      userLocation = await getCurrentLocation();
    } catch (error) {
      console.error("Failed to get user location:", error);
      setNotification({ message: `Location error: ${error}`, type: 'error' });
      return;
    }

    if (!userLocation) {
      setNotification({ message: "Could not get your current location to mark attendance.", type: 'warning' });
      return;
    }

    for (const slot of todaySchedule.slots) {
      const [fromHour, fromMinute] = slot.from.split(':').map(Number);
      const [toHour, toMinute] = slot.to.split(':').map(Number);

      const slotStartTimeInMinutes = fromHour * 60 + fromMinute;
      const slotEndTimeInMinutes = toHour * 60 + toMinute;
      const slotDurationInMinutes = slotEndTimeInMinutes - slotStartTimeInMinutes;
      const halfTimeInMinutes = slotStartTimeInMinutes + Math.floor(slotDurationInMinutes / 2);
      const tenMinutesAfterStart = slotStartTimeInMinutes + 10;

      const isAroundHalfTime = currentTimeInMinutes >= (halfTimeInMinutes - 5) && currentTimeInMinutes <= (halfTimeInMinutes + 5);

      const isWithinFirstTenMinutes = currentTimeInMinutes >= slotStartTimeInMinutes && currentTimeInMinutes <= tenMinutesAfterStart;

      const attendanceForToday = attendanceRecords[todayDateString] || {};
      if (attendanceForToday[slot.id] && attendanceForToday[slot.id].status !== 'pending') {
        continue;
      }

      if (isWithinFirstTenMinutes && currentTimeInMinutes > slotStartTimeInMinutes && !attendanceForToday[slot.id]) {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          slot.location.lat, slot.location.lng
        );
        const isAtLocation = distance < 100;

        if (!isAtLocation) {
          setNotification({ message: `Reminder: You are not at the location for ${slot.subjectName} (${slot.from}-${slot.to})!`, type: 'warning' });
        }
      }

      if (isAroundHalfTime) {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          slot.location.lat, slot.location.lng
        );
        const isAtLocation = distance < 100;

        const newAttendanceStatus = isAtLocation ? 'attended' : 'not-attended';

        const updatedRecords = {
          ...attendanceRecords,
          [todayDateString]: {
            ...(attendanceRecords[todayDateString] || {}),
            [slot.id]: {
              status: newAttendanceStatus,
              modified: false,
              subjectName: slot.subjectName,
              timeSlot: `${slot.from}-${slot.to}`,
              exclude: slot.exclude || false,
              locationName: slot.location.name || `${slot.location.lat}, ${slot.location.lng}`,
            },
          },
        };
        await updateUserData({ attendanceRecords: updatedRecords });
        setNotification({
          message: `Attendance for ${slot.subjectName} (${slot.from}-${slot.to}) marked as ${newAttendanceStatus}.`,
          type: 'success',
        });
      }
    }
  }, [userId, schedule, attendanceRecords, updateUserData]);

  useEffect(() => {
    const interval = setInterval(checkAndMarkAttendance, 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndMarkAttendance]);

  const handleToggleAttendance = async (dateString, slotId, currentStatus, currentExclude) => {
    const updatedRecords = { ...attendanceRecords };
    const newStatus = currentStatus === 'attended' ? 'not-attended' : 'attended';

    const existingSlotData = updatedRecords[dateString][slotId];

    updatedRecords[dateString] = {
      ...(updatedRecords[dateString] || {}),
      [slotId]: {
        ...existingSlotData,
        status: newStatus,
        modified: true,
        exclude: currentExclude,
      },
    };
    await updateUserData({ attendanceRecords: updatedRecords });
    setNotification({ message: `Attendance for slot ${slotId} on ${dateString} manually changed to ${newStatus}.`, type: 'info' });
  };

  const handleToggleExclude = async (dateString, slotId, currentExclude) => {
    const updatedRecords = { ...attendanceRecords };
    const existingSlotData = updatedRecords[dateString][slotId];

    updatedRecords[dateString] = {
      ...(updatedRecords[dateString] || {}),
      [slotId]: {
        ...existingSlotData,
        exclude: !currentExclude,
      },
    };
    await updateUserData({ attendanceRecords: updatedRecords });
    setNotification({ message: `Slot ${slotId} on ${dateString} is now ${!currentExclude ? 'excluded' : 'included'} from calculation.`, type: 'info' });
  };

  const calculateMonthlyAttendance = useCallback((year, month) => {
    console.log(`Calculating for month: ${month}/${year}`);
    console.log("Current attendanceRecords for calculation:", attendanceRecords);

    let totalAttended = 0;
    let totalConsidered = 0;
    let totalAttendedModified = 0;
    let totalConsideredModified = 0;

    for (const dateString in attendanceRecords) {
      const [recordYear, recordMonth] = dateString.split('-').map(Number);
      if (recordYear === year && recordMonth === month) {
        console.log(`Processing date: ${dateString}`);
        const dailySlots = attendanceRecords[dateString];
        for (const slotId in dailySlots) {
          const slot = dailySlots[slotId];
          console.log(`  Slot ${slotId}: Status=${slot.status}, Modified=${slot.modified}, Exclude=${slot.exclude}`);

          if (!slot.exclude) {
            totalConsidered++;
            if (slot.status === 'attended' && !slot.modified) {
              totalAttended++;
            }
          }

          if (!slot.exclude) {
            totalConsideredModified++;
            if (slot.status === 'attended') {
              totalAttendedModified++;
            }
          }
        }
      }
    }

    const percent = totalConsidered > 0 ? (totalAttended / totalConsidered * 100).toFixed(2) : 0;
    const percentModified = totalConsideredModified > 0 ? (totalAttendedModified / totalConsideredModified * 100).toFixed(2) : 0;

    const results = {
      percent: parseFloat(percent),
      percentModified: parseFloat(percentModified),
      totalAttended,
      totalConsidered,
      totalAttendedModified,
      totalConsideredModified,
    };
    console.log("Calculated Monthly Stats:", results);
    return results;
  }, [attendanceRecords]);

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const monthlyStats = calculateMonthlyAttendance(currentYear, currentMonth);

  useEffect(() => {
    if (monthlyStats.totalConsideredModified > 0 && monthlyStats.percentModified < minAttendancePercent) {
      setNotification({
        message: `Warning: Your attendance (${monthlyStats.percentModified}%) is below the minimum required (${minAttendancePercent}%).`,
        type: 'warning',
      });
    }
  }, [monthlyStats.percentModified, minAttendancePercent, monthlyStats.totalConsideredModified]);

  const handlePrevMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    console.log("Dashboard - monthlyStats updated:", monthlyStats);
  }, [monthlyStats]);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen font-inter">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
        Attendance Dashboard
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Bell className="mr-2 text-indigo-600" /> Monthly Attendance Summary
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
          <button onClick={handlePrevMonth} className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-700 dark:text-white dark:hover:bg-indigo-600 transition duration-150">
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
            {getMonthName(currentDate)}
          </span>
          <button onClick={handleNextMonth} className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-700 dark:text-white dark:hover:bg-indigo-600 transition duration-150">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-center">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow-md">
            <p className="text-sm text-indigo-700 dark:text-indigo-200">Attendance (No Modification)</p>
            <p className="text-3xl sm:text-4xl font-extrabold text-indigo-800 dark:text-indigo-100 mt-2">
              {monthlyStats.percent}%
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-300">
              ({monthlyStats.totalAttended} / {monthlyStats.totalConsidered} slots)
            </p>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow-md">
            <p className="text-sm text-indigo-700 dark:text-indigo-200">Attendance (With Modification)</p>
            <p className="text-3xl sm:text-4xl font-extrabold text-indigo-800 dark:text-indigo-100 mt-2">
              {monthlyStats.percentModified}%
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-300">
              ({monthlyStats.totalAttendedModified} / {monthlyStats.totalConsideredModified} slots)
            </p>
          </div>
        </div>
        <p className="mt-4 text-center text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">
          Minimum required attendance: <span className="text-indigo-600 dark:text-indigo-400">{minAttendancePercent}%</span>
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Calendar className="mr-2 text-indigo-600" /> Daily Attendance Records
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time Slot
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mod.
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Exc.
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Object.keys(attendanceRecords).sort((a, b) => b.localeCompare(a)).map((dateString) => (
                Object.keys(attendanceRecords[dateString]).map((slotId) => {
                  const record = attendanceRecords[dateString][slotId];
                  const statusColor = record.status === 'attended' ? 'text-green-600' : 'text-red-600';
                  const statusBg = record.status === 'attended' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900';
                  return (
                    <tr key={`${dateString}-${slotId}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {dateString}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {record.timeSlot}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {record.subjectName}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {record.locationName || 'N/A'}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBg} ${statusColor}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {record.modified ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {record.exclude ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleAttendance(dateString, slotId, record.status, record.exclude)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-1 sm:mr-3 p-1 sm:p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-gray-700 transition duration-150"
                          title="Toggle Attendance"
                        >
                          <Edit size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                          onClick={() => handleToggleExclude(dateString, slotId, record.exclude)}
                          className={`p-1 sm:p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ${record.exclude ? 'text-red-600' : 'text-green-600'}`}
                          title={record.exclude ? "Include in calculation" : "Exclude from calculation"}
                        >
                          {record.exclude ? <Minus size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <Plus size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ))}
              {Object.keys(attendanceRecords).length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
    </div>
  );
};

const SchedulePage = () => {
  const { subjects, setSubjects, schedule, setSchedule, updateUserData } = useData();
  const [newSubject, setNewSubject] = useState('');
  const [activeDay, setActiveDay] = useState('Monday');
  const [locationType, setLocationType] = useState('predefined');
  const [selectedPredefinedLocation, setSelectedPredefinedLocation] = useState('');
  const [newManualLocationName, setNewManualLocationName] = useState('');

  const [newSlot, setNewSlot] = useState({
    from: '',
    to: '',
    subjectId: '',
    location: { lat: '', lng: '', name: '' },
    exclude: false
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const predefinedLocations = [
    { name: 'Orion', lat: 10.759973571454065, lng: 78.81130220593371 },
    { name: 'Logos', lat: 10.761263459154467, lng: 78.81379729180948 },
    { name: 'Ojas', lat: 10.761234110954323, lng: 78.80909646675259 },
  ];

  useEffect(() => {
    const updatedSchedule = [...schedule];
    daysOfWeek.forEach(day => {
      if (!updatedSchedule.some(s => s.day === day)) {
        updatedSchedule.push({ day, slots: [] });
      }
    });
    updatedSchedule.sort((a, b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day));
    if (JSON.stringify(updatedSchedule) !== JSON.stringify(schedule)) {
      setSchedule(updatedSchedule);
    }
  }, [schedule]);

  const handleAddSubject = async () => {
    if (newSubject.trim() === '') {
      setMessage('Subject name cannot be empty.');
      setMessageType('error');
      return;
    }
    const subjectId = `sub-${Date.now()}`;
    const updatedSubjects = [...subjects, { id: subjectId, name: newSubject.trim() }];
    setSubjects(updatedSubjects);
    await updateUserData({ subjects: updatedSubjects });
    setNewSubject('');
    setMessage('Subject added successfully!');
    setMessageType('success');
  };

  const handleDeleteSubject = async (id) => {
    const updatedSubjects = subjects.filter(sub => sub.id !== id);
    setSubjects(updatedSubjects);
    await updateUserData({ subjects: updatedSubjects });
    setMessage('Subject deleted successfully!');
    setMessageType('success');
  };

  const handleAddSlot = async () => {
    let finalLocation = { lat: '', lng: '', name: '' };

    if (locationType === 'predefined') {
      const selectedLoc = predefinedLocations.find(loc => loc.name === selectedPredefinedLocation);
      if (!selectedLoc) {
        setMessage('Please select a predefined location.');
        setMessageType('error');
        return;
      }
      finalLocation = { ...selectedLoc };
    } else {
      if (!newSlot.location.lat || !newSlot.location.lng || !newManualLocationName.trim()) {
        setMessage('For manual entry, Latitude, Longitude, and Location Name are required.');
        setMessageType('error');
        return;
      }
      if (isNaN(parseFloat(newSlot.location.lat)) || isNaN(parseFloat(newSlot.location.lng))) {
        setMessage('Latitude and Longitude must be valid numbers.');
        setMessageType('error');
        return;
      }
      finalLocation = {
        lat: parseFloat(newSlot.location.lat),
        lng: parseFloat(newSlot.location.lng),
        name: newManualLocationName.trim(),
      };
    }

    if (!newSlot.from || !newSlot.to || !newSlot.subjectId) {
      setMessage('From Time, To Time, and Subject are required.');
      setMessageType('error');
      return;
    }

    const subjectName = subjects.find(s => s.id === newSlot.subjectId)?.name || 'Unknown Subject';

    const slotId = `slot-${Date.now()}`;
    const updatedSchedule = schedule.map(dayEntry => {
      if (dayEntry.day === activeDay) {
        return {
          ...dayEntry,
          slots: [
            ...dayEntry.slots,
            {
              id: slotId,
              from: newSlot.from,
              to: newSlot.to,
              subjectId: newSlot.subjectId,
              subjectName: subjectName,
              location: finalLocation,
              exclude: newSlot.exclude,
            },
          ].sort((a, b) => {
            const timeA = parseInt(a.from.replace(':', ''));
            const timeB = parseInt(b.from.replace(':', ''));
            return timeA - timeB;
          }),
        };
      }
      return dayEntry;
    });
    setSchedule(updatedSchedule);
    await updateUserData({ schedule: updatedSchedule });
    setNewSlot({ from: '', to: '', subjectId: '', location: { lat: '', lng: '', name: '' }, exclude: false });
    setSelectedPredefinedLocation('');
    setNewManualLocationName('');
    setMessage('Slot added successfully!');
    setMessageType('success');
  };

  const handleDeleteSlot = async (slotIdToDelete) => {
    const updatedSchedule = schedule.map(dayEntry => {
      if (dayEntry.day === activeDay) {
        return {
          ...dayEntry,
          slots: dayEntry.slots.filter(slot => slot.id !== slotIdToDelete),
        };
      }
      return dayEntry;
    });
    setSchedule(updatedSchedule);
    await updateUserData({ schedule: updatedSchedule });
    setMessage('Slot deleted successfully!');
    setMessageType('success');
  };

  const currentDaySchedule = schedule.find(s => s.day === activeDay);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen font-inter">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
        Manage Schedule
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Book className="mr-2 text-indigo-600" /> Subjects
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            placeholder="New Subject Name"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />
          <button
            onClick={handleAddSubject}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center"
          >
            <Plus size={20} className="mr-2" /> Add Subject
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 col-span-full">No subjects added yet. Add one above!</p>
          ) : (
            subjects.map(subject => (
              <div key={subject.id} className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-700">
                <span className="text-base sm:text-lg font-medium text-indigo-800 dark:text-indigo-100">{subject.name}</span>
                <button
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800 transition duration-150"
                  title="Delete Subject"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Calendar className="mr-2 text-indigo-600" /> Time Slots
        </h2>

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {daysOfWeek.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out
                ${activeDay === day
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-inner">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Plus size={18} className="mr-2" /> Add New Slot for {activeDay}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fromTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Time</label>
              <input
                type="time"
                id="fromTime"
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                value={newSlot.from}
                onChange={(e) => setNewSlot({ ...newSlot, from: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="toTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Time</label>
              <input
                type="time"
                id="toTime"
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                value={newSlot.to}
                onChange={(e) => setNewSlot({ ...newSlot, to: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="subjectSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
              <select
                id="subjectSelect"
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                value={newSlot.subjectId}
                onChange={(e) => setNewSlot({ ...newSlot, subjectId: e.target.value })}
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Choose Location Type</label>
              <select
                id="locationType"
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                value={locationType}
                onChange={(e) => {
                  setLocationType(e.target.value);
                  if (e.target.value === 'predefined') {
                    setNewSlot(prev => ({ ...prev, location: { lat: '', lng: '', name: '' } }));
                    setNewManualLocationName('');
                  } else {
                    setSelectedPredefinedLocation('');
                  }
                }}
              >
                <option value="predefined">Select from Predefined</option>
                <option value="manual">Enter Manually</option>
              </select>
            </div>

            {locationType === 'predefined' && (
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="predefinedLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Predefined Location</label>
                <select
                  id="predefinedLocation"
                  className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedPredefinedLocation}
                  onChange={(e) => setSelectedPredefinedLocation(e.target.value)}
                >
                  <option value="">Select a location</option>
                  {predefinedLocations.map(loc => (
                    <option key={loc.name} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>
            )}

            {locationType === 'manual' && (
              <>
                <div>
                  <label htmlFor="manualLocationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location Name</label>
                  <input
                    type="text"
                    id="manualLocationName"
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., My Apartment"
                    value={newManualLocationName}
                    onChange={(e) => setNewManualLocationName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="locationLat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                  <input
                    type="text"
                    id="locationLat"
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 13.0827"
                    value={newSlot.location.lat}
                    onChange={(e) => setNewSlot({ ...newSlot, location: { ...newSlot.location, lat: e.target.value } })}
                  />
                </div>
                <div>
                  <label htmlFor="locationLng" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                  <input
                    type="text"
                    id="locationLng"
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 80.2707"
                    value={newSlot.location.lng}
                    onChange={(e) => setNewSlot({ ...newSlot, location: { ...newSlot.location, lng: e.target.value } })}
                  />
                </div>
              </>
            )}

            <div className="flex items-center col-span-1 md:col-span-2">
              <input
                type="checkbox"
                id="excludeSlot"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                checked={newSlot.exclude}
                onChange={(e) => setNewSlot({ ...newSlot, exclude: e.target.checked })}
              />
              <label htmlFor="excludeSlot" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Exclude from Attendance Calculation
              </label>
            </div>
          </div>
          <button
            onClick={handleAddSlot}
            className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center"
          >
            <Plus size={20} className="mr-2" /> Add Slot
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            * For manual entry, Latitude, Longitude, and Location Name are all required.
          </p>
        </div>

        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Clock className="mr-2 text-indigo-600" /> Slots for {activeDay}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {currentDaySchedule && currentDaySchedule.slots.length > 0 ? (
            currentDaySchedule.slots.map(slot => (
              <div key={slot.id} className="p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-700 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <p className="text-base sm:text-lg font-semibold text-indigo-800 dark:text-indigo-100">{slot.subjectName}</p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-200 flex items-center">
                    <Clock size={16} className="mr-1" /> {slot.from} - {slot.to}
                  </p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-200 flex items-center">
                    <MapPin size={16} className="mr-1" /> {slot.location.name || `Lat: ${slot.location.lat}, Lng: ${slot.location.lng}`}
                  </p>
                  {slot.exclude && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
                      <AlertTriangle size={14} className="mr-1" /> Excluded from calculation
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  className="mt-3 sm:mt-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800 transition duration-150"
                  title="Delete Slot"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No slots defined for {activeDay}. Add one above!</p>
          )}
        </div>
      </div>
      <Notification message={message} type={messageType} onClose={() => setMessage('')} />
    </div>
  );
};

const SettingsPage = () => {
  const { minAttendancePercent, setMinAttendancePercent, updateUserData } = useData();
  const [newMinPercent, setNewMinPercent] = useState(minAttendancePercent);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSaveMinPercent = async () => {
    const percent = parseInt(newMinPercent, 10);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      setMessage('Please enter a valid percentage between 0 and 100.');
      setMessageType('error');
      return;
    }
    setMinAttendancePercent(percent);
    await updateUserData({ minAttendancePercent: percent });
    setMessage('Minimum attendance percentage updated successfully!');
    setMessageType('success');
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen font-inter">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
        Settings
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Percent className="mr-2 text-indigo-600" /> Minimum Attendance Percentage
        </h2>
        <div className="flex items-center space-x-4 mb-6">
          <input
            type="number"
            min="0"
            max="100"
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            value={newMinPercent}
            onChange={(e) => setNewMinPercent(e.target.value)}
          />
          <span className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300">%</span>
        </div>
        <button
          onClick={handleSaveMinPercent}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center"
        >
          <CheckCircle size={20} className="mr-2" /> Save Setting
        </button>
      </div>
      <Notification message={message} type={messageType} onClose={() => setMessage('')} />
    </div>
  );
};

const StatsPage = () => {
  const { attendanceRecords, subjects } = useData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [statsResults, setStatsResults] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const calculateAttendanceForSubjectAndRange = useCallback(() => {
    setMessage('');
    if (!startDate || !endDate) {
      setStatsResults([]);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    if (start > end) {
      setMessage('Start date cannot be after end date.');
      setMessageType('error');
      setStatsResults([]);
      return;
    }

    const results = [];
    const subjectsToConsider = selectedSubjectId === 'all'
      ? subjects
      : subjects.filter(sub => sub.id === selectedSubjectId);

    if (subjectsToConsider.length === 0 && selectedSubjectId !== 'all') {
      setMessage('Selected subject not found.');
      setMessageType('warning');
      setStatsResults([]);
      return;
    }
    if (subjectsToConsider.length === 0 && selectedSubjectId === 'all' && subjects.length > 0) {
        setMessage('No subjects defined to calculate statistics.');
        setMessageType('info');
        setStatsResults([]);
        return;
    }

    const allSubjectsCombinedStats = {
        subjectName: "All Subjects Combined",
        totalAttended: 0,
        totalConsidered: 0,
        totalAttendedModified: 0,
        totalConsideredModified: 0,
    };

    let hasDataForRange = false;

    for (const dateString in attendanceRecords) {
        const recordDate = new Date(dateString);

        if (recordDate >= start && recordDate < end) {
            hasDataForRange = true;
            const dailySlots = attendanceRecords[dateString];
            for (const slotId in dailySlots) {
                const slot = dailySlots[slotId];

                if (selectedSubjectId === 'all' || slot.subjectId === selectedSubjectId) {
                    if (!slot.exclude) {
                        allSubjectsCombinedStats.totalConsidered++;
                        if (slot.status === 'attended' && !slot.modified) {
                            allSubjectsCombinedStats.totalAttended++;
                        }
                    }

                    if (!slot.exclude) {
                        allSubjectsCombinedStats.totalConsideredModified++;
                        if (slot.status === 'attended') {
                            allSubjectsCombinedStats.totalAttendedModified++;
                        }
                    }
                }
            }
        }
    }

    if (!hasDataForRange && startDate && endDate) {
        setMessage('No attendance data found for the selected date range.');
        setMessageType('info');
        setStatsResults([]);
        return;
    }

    if (selectedSubjectId === 'all') {
        const percent = allSubjectsCombinedStats.totalConsidered > 0 ? (allSubjectsCombinedStats.totalAttended / allSubjectsCombinedStats.totalConsidered * 100).toFixed(2) : 0;
        const percentModified = allSubjectsCombinedStats.totalConsideredModified > 0 ? (allSubjectsCombinedStats.totalAttendedModified / allSubjectsCombinedStats.totalConsideredModified * 100).toFixed(2) : 0;
        results.push({
            subjectName: allSubjectsCombinedStats.subjectName,
            percent: parseFloat(percent),
            percentModified: parseFloat(percentModified),
            totalAttended: allSubjectsCombinedStats.totalAttended,
            totalConsidered: allSubjectsCombinedStats.totalConsidered,
            totalAttendedModified: allSubjectsCombinedStats.totalAttendedModified,
            totalConsideredModified: allSubjectsCombinedStats.totalConsideredModified,
        });
    } else {
        const subject = subjectsToConsider[0];
        let totalAttended = 0;
        let totalConsidered = 0;
        let totalAttendedModified = 0;
        let totalConsideredModified = 0;

        for (const dateString in attendanceRecords) {
            const recordDate = new Date(dateString);
            if (recordDate >= start && recordDate < end) {
                const dailySlots = attendanceRecords[dateString];
                for (const slotId in dailySlots) {
                    const slot = dailySlots[slotId];
                    if (slot.subjectId === subject.id) {
                        if (!slot.exclude) {
                            totalConsidered++;
                            if (slot.status === 'attended' && !slot.modified) {
                                totalAttended++;
                            }
                        }
                        if (!slot.exclude) {
                            totalConsideredModified++;
                            if (slot.status === 'attended') {
                                totalAttendedModified++;
                            }
                        }
                    }
                }
            }
        }
        const percent = totalConsidered > 0 ? (totalAttended / totalConsidered * 100).toFixed(2) : 0;
        const percentModified = totalConsideredModified > 0 ? (totalAttendedModified / totalConsideredModified * 100).toFixed(2) : 0;
        results.push({
            subjectName: subject.name,
            percent: parseFloat(percent),
            percentModified: parseFloat(percentModified),
            totalAttended,
            totalConsidered,
            totalAttendedModified,
            totalConsideredModified,
        });
    }

    setStatsResults(results);
  }, [startDate, endDate, selectedSubjectId, attendanceRecords, subjects]);

  useEffect(() => {
    if (startDate && endDate) {
        calculateAttendanceForSubjectAndRange();
    } else {
        setStatsResults([]);
    }
  }, [calculateAttendanceForSubjectAndRange, startDate, endDate]);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen font-inter">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
        Attendance Statistics
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <ListFilter className="mr-2 text-indigo-600" /> Filter Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
            <input
              type="date"
              id="startDate"
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
            <input
              type="date"
              id="endDate"
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="subjectFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
            <select
              id="subjectFilter"
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>
        <Notification message={message} type={messageType} onClose={() => setMessage('')} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <BarChart2 className="mr-2 text-indigo-600" /> Results
        </h2>
        {statsResults.length === 0 && (startDate && endDate) && !message ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">No attendance data found for the selected criteria.</p>
        ) : (statsResults.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {statsResults.map((result, index) => (
              <div key={index} className="p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow-md border border-indigo-200 dark:border-indigo-700">
                <h3 className="text-lg sm:text-xl font-semibold text-indigo-800 dark:text-indigo-100 mb-2">{result.subjectName}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-200">Attendance (No Modification)</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-indigo-800 dark:text-indigo-100 mt-1">
                      {result.percent}%
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-300">
                      ({result.totalAttended} / {result.totalConsidered} slots)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-200">Attendance (With Modification)</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-indigo-800 dark:text-indigo-100 mt-1">
                      {result.percentModified}%
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-300">
                      ({result.totalAttendedModified} / {result.totalConsideredModified} slots)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center">Select a date range and subject to view statistics.</p>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const { currentUser, loadingAuth } = useAuth();
  const { loadingData } = useData();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loadingAuth || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-700 dark:text-gray-300">Loading application data...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 w-full">
      <nav className="bg-indigo-700 dark:bg-indigo-900 p-4 shadow-lg w-full">
        <div className="w-full px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-white mb-2 sm:mb-0">Attendance Tracker</h1>
          <div className="flex flex-wrap justify-center sm:justify-end items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-white text-sm sm:text-base flex items-center transition duration-150 ease-in-out
                ${currentPage === 'dashboard' ? 'bg-indigo-800' : 'hover:bg-indigo-600 dark:hover:bg-indigo-800'}`}
            >
              <Home size={18} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentPage('schedule')}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-white text-sm sm:text-base flex items-center transition duration-150 ease-in-out
                ${currentPage === 'schedule' ? 'bg-indigo-800' : 'hover:bg-indigo-600 dark:hover:bg-indigo-800'}`}
            >
              <Calendar size={18} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Schedule</span>
            </button>
            <button
              onClick={() => setCurrentPage('stats')}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-white text-sm sm:text-base flex items-center transition duration-150 ease-in-out
                ${currentPage === 'stats' ? 'bg-indigo-800' : 'hover:bg-indigo-600 dark:hover:bg-indigo-800'}`}
            >
              <BarChart2 size={18} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Stats</span>
            </button>
            <button
              onClick={() => setCurrentPage('settings')}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-white text-sm sm:text-base flex items-center transition duration-150 ease-in-out
                ${currentPage === 'settings' ? 'bg-indigo-800' : 'hover:bg-indigo-600 dark:hover:bg-indigo-800'}`}
            >
              <Settings size={18} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-red-500 text-white text-sm sm:text-base flex items-center hover:bg-red-600 transition duration-150 ease-in-out"
            >
              <LogOut size={18} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full py-4 sm:py-8 px-4 sm:px-6">
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'schedule' && <SchedulePage />}
        {currentPage === 'stats' && <StatsPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>

      <footer className="bg-gray-800 dark:bg-gray-950 text-gray-300 p-4 text-center text-xs sm:text-sm w-full">
        <p>&copy; {new Date().getFullYear()} Attendance Tracker App. All rights reserved.</p>
        <p>User ID: {currentUser.uid}</p>
      </footer>
    </div>
  );
};

export default function Root() {
  return (
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  );
}
