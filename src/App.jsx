// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Entry from "./pages/Entry";
import RoleSelect from "./pages/RoleSelect";
import OwnerHome from "./pages/OwnerHome";
import BaristaHome from "./pages/BaristaHome";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup";
import AuthCallback from "./pages/auth/AuthCallback";
import ResetPassword from "./pages/auth/ResetPassword";
import OwnerOnboarding from "./pages/onboarding/OwnerOnboarding";
import BaristaOnboarding from "./pages/onboarding/BaristaOnboarding";
import BaristaLayout from "./layouts/BaristaLayout";
import OwnerLayout from "./layouts/OwnerLayout";
import BaristaMyPage from "./pages/barista/BaristaMyPage";
import BaristaProfile from "./pages/barista/BaristaProfile";
import BaristaProfileEdit from "./pages/barista/BaristaProfileEdit";
import AboutNowshot from "./pages/mypage/policy/about";
import FaqPage from "./pages/mypage/policy/faq";
import MarketingPolicy from "./pages/mypage/policy/marketing";
import PrivacyPolicy from "./pages/mypage/policy/privacy";
import TermsPolicy from "./pages/mypage/policy/terms";
import JobCreate from "./pages/owner/JobCreate";
import JobList from "./pages/owner/JobList";
import JobManage from "./pages/owner/JobManage";
import JobEdit from "./pages/owner/JobEdit";
import ApplicationList from "./pages/ApplicationList";
import JobPostDetail from "./pages/JobPostDetail";
import ApplicationForm from "./pages/ApplicationForm";
import ShortTermJobs from "./pages/ShortTermJobs";
import FullTimeJobs from "./pages/FullTimeJobs";
import BaristaApplications from "./pages/BaristaApplications";
import ApplicationDetail from "./pages/ApplicationDetail";
import BaristaApplicationDetail from "./pages/BaristaApplicationDetail";
import OwnerMyPage from "./pages/owner/OwnerMyPage";
import BaristaManagement from "./pages/owner/BaristaManagement";
import BaristaDetail from "./pages/owner/BaristaDetail";
import OwnerProfileEdit from "./pages/owner/OwnerProfileEdit";
import CafeManage from "./pages/owner/CafeManage";

export default function App() {
  return (
    <Routes>
      {/* 공개 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      {/* Entry (모든 분기 시작점) */}
      <Route path="/" element={<Entry />} />

      {/* Role Select */}
      <Route path="/role" element={<RoleSelect />} />

      {/* Onboarding */}
      <Route path="/onboarding/owner" element={<OwnerOnboarding />} />
      <Route path="/onboarding/barista" element={<BaristaOnboarding />} />

      {/* Barista */}
      <Route path="/barista" element={<BaristaLayout />}>
        <Route index element={<BaristaHome />} />
        <Route path="baristadetail/:id" element={<JobPostDetail />} />
        <Route path="apply/:id" element={<ApplicationForm />} />
        <Route path="baristamypage" element={<BaristaMyPage />} />
        <Route path="profile" element={<BaristaProfile />} />
        <Route path="profile/edit" element={<BaristaProfileEdit />} />
        <Route path="short-term" element={<ShortTermJobs />} />
        <Route path="full-time" element={<FullTimeJobs />} />
        <Route path="applications" element={<BaristaApplications />} />
        <Route
          path="applications/:id"
          element={<BaristaApplicationDetail />}
        />
      </Route>

      <Route path="/policy/privacy" element={<PrivacyPolicy />} />
      <Route path="/policy/terms" element={<TermsPolicy />} />
      <Route path="/policy/marketing" element={<MarketingPolicy />} />
      <Route path="/about" element={<AboutNowshot />} />
      <Route path="/faq" element={<FaqPage />} />

      {/* Owner */}
      <Route path="/owner" element={<OwnerLayout />}>
        <Route index element={<OwnerHome />} />
        <Route path="mypage" element={<OwnerMyPage />} />
        <Route path="cafes" element={<CafeManage />} />
        <Route path="profile/edit" element={<OwnerProfileEdit />} />
        <Route path="applicants" element={<ApplicationList />} />
        <Route path="applicants/:id" element={<ApplicationDetail />} />
        <Route path="baristas" element={<BaristaManagement />} />
        <Route path="baristas/:applicationId" element={<BaristaDetail />} />
        <Route path="jobs/new" element={<JobCreate />} />
        <Route path="jobs" element={<JobList />} />
        <Route path="jobs/:id" element={<JobManage />} />
        <Route path="jobs/:id/edit" element={<JobEdit />} />
      </Route>
    </Routes>
  );
}
