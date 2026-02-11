import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { loginApi } from "@/services/auth-service";
import { setAuthToken } from "@/lib/auth";

type LoginFormValues = {
    email: string;
    password: string;
};

type Props = {
    onSuccess: () => void;
};

export function LoginForm({ onSuccess }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        defaultValues: { email: "", password: "" },
        mode: "onBlur",
    });

    const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
        setServerError("");
        setIsLoading(true);

        try {
            const res = await loginApi(values);

            const token = res.token ?? res.access ?? res.access_token;
            if (!token) {
                setServerError("La API no devolvió token. Revisa el response del login.");
                return;
            }

            setAuthToken(token);
            onSuccess();
        } catch (err: any) {
            // Axios error handling is a bit different if using the service
            // But since we catch generic error here
            console.error(err);
            if (err.response) {
                const status = err.response.status;
                const data = err.response.data;
                if (status === 400 || status === 401) {
                    setServerError(data?.detail || data?.message || "Email o contraseña incorrectos.");
                } else {
                    setServerError("Error de servidor. Intenta nuevamente.");
                }
            } else {
                setServerError("Error inesperado al conectar con el servidor.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center p-4 bg-[#0f172a] bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.15)_0%,transparent_40%),radial-gradient(circle_at_90%_80%,rgba(236,72,153,0.15)_0%,transparent_40%)]">
            <div className="w-full max-w-[420px]">
                <div className="relative overflow-hidden w-full p-7 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.20),0_2px_10px_rgba(0,0,0,0.10)] rounded-none border border-transparent">
                    {/* Header Bar */}
                    <div className="absolute top-0 left-0 w-full h-[12px] bg-[linear-gradient(90deg,#0b3c7d,#0f4c97,#2bb673)]" />

                    {/* Decorative Glow */}
                    <div className="absolute -top-[70px] -right-[70px] w-[190px] h-[190px] bg-[radial-gradient(circle,rgba(15,76,151,0.18),transparent_65%)] pointer-events-none" />

                    {/* Header */}
                    <div className="text-center mb-[18px]">
                        <div className="w-14 h-14 mx-auto mb-[14px] rounded-[14px] grid place-items-center bg-[linear-gradient(135deg,#1e3a5f,#3a6b8c)] shadow-[0_10px_24px_rgba(30,58,95,0.25)]">
                            <Lock className="text-white w-6 h-6" />
                        </div>

                        <h5 className="text-[#0f172a] font-extrabold text-xl">Bienvenido</h5>
                        <p className="mt-[6px] text-[#64748b] text-sm">Ingresa tu email y contraseña.</p>
                    </div>

                    <div className="my-[16px] mb-[18px] h-px bg-slate-200" />

                    {serverError && (
                        <div className="mb-[14px] p-3 rounded bg-red-100 text-red-700 text-sm">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Email</label>
                            <div className={`relative group transition-all duration-200 rounded-xl bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200 group-hover:border-slate-300'} focus-within:bg-white focus-within:!border-[#3a6b8c] focus-within:ring-4 focus-within:ring-[#0f4c97]/10`}>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    {...register("email", {
                                        required: "El email es obligatorio",
                                        pattern: { value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/, message: "Email no válido" }
                                    })}
                                    className="block w-full pl-10 pr-3 py-3 bg-transparent rounded-xl focus:outline-none text-slate-900 placeholder-slate-400 sm:text-sm"
                                    placeholder="ejemplo@correo.com"
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Contraseña</label>
                            <div className={`relative group transition-all duration-200 rounded-xl bg-slate-50 border ${errors.password ? 'border-red-500' : 'border-slate-200 group-hover:border-slate-300'} focus-within:bg-white focus-within:!border-[#3a6b8c] focus-within:ring-4 focus-within:ring-[#0f4c97]/10`}>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    {...register("password", {
                                        required: "La contraseña es obligatoria",
                                        minLength: { value: 3, message: "Mínimo 3 caracteres" },
                                    })}
                                    className="block w-full pl-10 pr-10 py-3 bg-transparent rounded-xl focus:outline-none text-slate-900 placeholder-slate-400 sm:text-sm"
                                    placeholder="••••••"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs ml-1">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-[0_14px_28px_rgba(30,58,95,0.24)] text-sm font-extrabold text-white bg-[linear-gradient(90deg,#1e3a5f,#3a6b8c)] hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a5f] disabled:opacity-75 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? (
                                "Ingresando..."
                            ) : (
                                <>
                                    {/*<LogIn className="mr-2 h-5 w-5" />*/}
                                    Ingresar
                                </>
                            )}
                        </button>

                        <div className="flex justify-end pt-2">
                            <button type="button" className="text-sm text-slate-500 hover:text-[#3a6b8c] hover:underline bg-transparent border-0 cursor-pointer">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
