import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router-dom";
import { AppLayout } from "@/app/layout";
import DashboardPage from "@/app/page";
import RulesPage from "@/app/rules/page";
import ScenariosPage from "@/app/scenarios/page";
import NewScenarioPage from "@/app/scenarios/new/page";
import ScenarioDetailPage from "@/app/scenarios/[id]/page";
import LoginPage from "@/app/login/page";
import PrivateRoute from "@/components/auth/private-route";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout><Outlet /></AppLayout>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/scenarios" element={<ScenariosPage />} />
            <Route path="/scenarios/new" element={<NewScenarioPage />} />
            <Route path="/scenarios/:id" element={<ScenarioDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
