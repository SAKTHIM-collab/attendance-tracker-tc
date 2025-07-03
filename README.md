# Attendance Tracking App (TC induction)


(scroll down for website link and demo video)

A responsive web application built with React and Firebase to help users track their attendance for various subjects and time slots, with features for managing schedules, viewing statistics, and automatic location-based marking.

## Features

User Authentication: Secure sign-up and login using email and password (Firebase Authentication).

Subject Management: Add, view, and delete subjects.

Flexible Scheduling:

Define daily time slots for subjects.

Assign specific locations (latitude, longitude) to each slot, either from predefined options (Orion, Logos, Ojas) or by manual entry with a custom name.

Option to exclude specific slots from attendance calculations.

Automatic Attendance Marking: Automatically marks attendance based on user's proximity (within 100m radius) to the scheduled location during the class time.

Manual Attendance Adjustment: Users can manually toggle attendance status for any slot, with a "modified" flag.

Attendance Dashboard: View monthly attendance summaries, including percentages with and without manual modifications.

Daily Records: Detailed table view of all attendance records, showing date, time, subject, location name, status, and modification status.

Attendance Statistics: Filter and view attendance statistics for specific subjects and date ranges.

Settings: Configure the minimum required attendance percentage.

Responsive Design: Optimized for seamless experience on both desktop and mobile devices using Tailwind CSS.

Real-time Data: Data synchronized in real-time using Cloud Firestore.

##Technologies Used

Frontend:

React

Vite (for fast development and bundling)

Tailwind CSS (for styling and responsiveness)

Lucide React (for icons)

Backend & Database:

Firebase Authentication

Cloud Firestore

Firebase Hosting

## Usage

Sign Up/Login: Create a new account or log in with an existing one.

Manage Schedule: Go to the "Schedule" page to add subjects and define time slots for each day. When adding a slot, choose a predefined location or manually enter coordinates and a name.

Dashboard: View your monthly attendance summary.

Daily Records: See a detailed list of all your attendance entries. You can manually toggle attendance status and exclude slots from calculations.

Settings: Adjust your minimum required attendance percentage.

Automatic Attendance: Ensure your browser's location services are enabled for the app to automatically mark attendance when you are at a scheduled location during the class time.

## Contributing

Contributions are welcome! If you have suggestions for improvements or find any bugs, please open an issue or submit a pull request.


website link : https://mapw-5bc07.web.app/

demo video : https://drive.google.com/file/d/1h9_d-Y7ln2hak9FWgPS63RlKul-3DCBO/view?usp=gmail


# THANK YOU!
