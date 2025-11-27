import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { useAuthPage } from "@/hooks/useAuthPage";

export default function Auth() {
  const {
    loading,
    register,
    handleSubmit,
    errors,
    onSubmit,
  } = useAuthPage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-2 border-border rounded-2xl overflow-hidden">
          <CardHeader className="space-y-6 text-center bg-gradient-to-br from-primary/5 to-secondary/5 pb-8 pt-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center"
            >
              <img
                src="/pg-rotisserie-banner.png"
                alt="Paola Gonçalves Rotisserie"
                className="h-28 w-auto object-contain rounded-xl"
              />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-display font-bold text-foreground">
                Bem-vindo!
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className="h-12 rounded-xl border-2 border-border bg-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {errors.email && (
                  <span className="text-xs text-destructive">{errors.email.message}</span>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="h-12 rounded-xl border-2 border-border bg-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {errors.password && (
                  <span className="text-xs text-destructive">{errors.password.message}</span>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                      />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                          Entrar
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 text-center"
            >
              <p className="text-xs text-muted-foreground">
                Ao continuar, você concorda com nossos Termos de Serviço
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}