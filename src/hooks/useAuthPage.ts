import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, signUp, getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { authSchema, type AuthFormData } from "@/schemas/auth.schema";

export function useAuthPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        getCurrentSession().then(({ session }) => {
            if (session) {
                navigate("/admin");
            }
        });
    }, [navigate]);

    const onSubmit = async (data: AuthFormData) => {
        setLoading(true);

        try {
            const { error, session } = await signIn(data.email, data.password)
            if (error) {
                if (error.message.includes("Invalid login credentials")) {
                    toast.error("Email ou senha incorretos");
                } else if (error.message.includes("User already registered")) {
                    toast.error("Email já cadastrado");
                } else {
                    toast.error("Erro na autenticação");
                }
            } else if (session) {
                toast.success("Login realizado!");
                navigate("/admin");
            }
        } catch (err) {
            toast.error("Ocorreu um erro inesperado");
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        register,
        handleSubmit,
        errors,
        onSubmit,
    };
}
