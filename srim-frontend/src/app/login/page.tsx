
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    const navigate = useNavigate();

    return (
        <LoginForm
            onSuccess={() => navigate("/", { replace: true })}
        />
    );
}
