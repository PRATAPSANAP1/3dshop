import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user?.role === "admin" || user?.role === "staff") {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  }, [user, loading, navigate]);

  return null;
};

export default Index;
