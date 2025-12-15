import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navigation } from "@/components/ui/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/lib/types";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Auth = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

const loginSchema = z.object({
    email: z.string().email(t("auth.emailRequired")),
    password: z.string().min(6, t("auth.passwordMin")),
  role: z.enum(["student", "shopkeeper"] as const),
});

const registerSchema = loginSchema
  .extend({
      name: z.string().min(2, t("auth.nameMin")),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwordMatch"),
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "student",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "student",
    },
  });

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const loggedInUser = await login(data.email, data.password, data.role);
      toast({
        title: t("auth.welcomeBack"),
        description: t("auth.loginSuccess"),
      });

      // Redirect based on role (including developer from hardcoded login)
      if (loggedInUser.role === "developer") {
        navigate("/developer");
      } else if (loggedInUser.role === "student") {
        navigate("/home");
      } else if (loggedInUser.role === "shopkeeper") {
        navigate("/admin");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("auth.loginFailed"),
        description: t("auth.loginError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const registeredUser = await register(data.email, data.password, data.name, data.role);
      toast({
        title: t("auth.registerSuccess"),
        description: t("auth.registerSuccessDesc"),
      });

      // Redirect based on role
      if (registeredUser.role === "student") {
        navigate("/home");
      } else if (registeredUser.role === "shopkeeper") {
        navigate("/admin");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("auth.registerFailed"),
        description: t("auth.registerError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "student":
        return "Order food from campus shops and track your tokens";
      case "shopkeeper":
        return "Manage your shop, menu, and orders";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("nav.home")}
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("auth.welcomeToTakeAway", { defaultValue: "Welcome to TakeAway" })}
            </h1>
            <p className="text-gray-600">
              {t("auth.signInOrCreate", { defaultValue: "Sign in to your account or create a new one" })}
            </p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-gray-900">
                {t("auth.getStarted", { defaultValue: "Get Started" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">{t("auth.signIn")}</TabsTrigger>
                  <TabsTrigger value="register">{t("auth.signUp")}</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form
                    onSubmit={loginForm.handleSubmit(onLogin)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t("auth.email")}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="student@university.edu"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t("auth.password")}</Label>
                      <Input
                        id="login-password"
                        type="password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-role">{t("auth.iAmA", { defaultValue: "I am a" })}</Label>
                      <Select
                        value={loginForm.watch("role")}
                        onValueChange={(value) =>
                          loginForm.setValue("role", value as "student" | "shopkeeper")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">{t("auth.student")}</SelectItem>
                          <SelectItem value="shopkeeper">{t("auth.shopkeeper")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        {getRoleDescription(loginForm.watch("role"))}
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("auth.signIn")}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form
                    onSubmit={registerForm.handleSubmit(onRegister)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="register-name">{t("auth.fullName", { defaultValue: "Full Name" })}</Label>
                      <Input
                        id="register-name"
                        placeholder="John Doe"
                        {...registerForm.register("name")}
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">{t("auth.email")}</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="student@university.edu"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">{t("auth.password")}</Label>
                      <Input
                        id="register-password"
                        type="password"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">
                        {t("auth.confirmPassword")}
                      </Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        {...registerForm.register("confirmPassword")}
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600">
                          {
                            registerForm.formState.errors.confirmPassword
                              .message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-role">{t("auth.iAmA", { defaultValue: "I am a" })}</Label>
                      <Select
                        value={registerForm.watch("role")}
                        onValueChange={(value) =>
                          registerForm.setValue("role", value as "student" | "shopkeeper")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">{t("auth.student")}</SelectItem>
                          <SelectItem value="shopkeeper">{t("auth.shopkeeper")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        {getRoleDescription(registerForm.watch("role"))}
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("auth.createAccount", { defaultValue: "Create Account" })}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
