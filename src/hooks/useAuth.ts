import { useEffect } from "react";
import { NavigateFunction } from "react-router-dom";
import { getCurrentSession } from "@/services/auth";

export function useAuth(navigate: NavigateFunction) {
    useEffect(() => {
        const checkAuth = async () => {
            const { session } = await getCurrentSession();
            if (!session) {
                navigate("/auth");
            }
        };

        checkAuth();
    }, [navigate]);
}