import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/app/layout";
import DashboardPage from "@/app/page";
import RulesPage from "@/app/rules/page";
import ScenariosPage from "@/app/scenarios/page";
import ScenarioDetailPage from "@/app/scenarios/[id]/page";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/scenarios/:id" element={<ScenarioDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
