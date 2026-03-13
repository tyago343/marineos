import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import RegisterScreen from "../app/(auth)/register";

const mockSignUp = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock("@marineos/hooks", () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    signOut: jest.fn(),
    user: null,
    session: null,
    loading: false,
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: mockBack,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "auth.register.title": "Create account",
        "auth.register.subtitle": "Sign up to start managing your boat",
        "auth.register.fullName": "Full name",
        "auth.register.fullNamePlaceholder": "Your name",
        "auth.register.email": "Email",
        "auth.register.emailPlaceholder": "you@email.com",
        "auth.register.password": "Password",
        "auth.register.passwordPlaceholder": "At least 8 characters",
        "auth.register.confirmPassword": "Confirm password",
        "auth.register.confirmPasswordPlaceholder": "Repeat your password",
        "auth.register.submit": "Create account",
        "auth.register.hasAccount": "Already have an account?",
        "auth.register.login": "Sign in",
        "auth.register.error.emailTaken": "This email is already registered",
        "auth.register.success.title": "Account created!",
        "auth.register.success.checkEmail": "Check your email to confirm your account",
        "auth.validation.email.required": "Email is required",
        "auth.validation.email.invalid": "Invalid email address",
        "auth.validation.password.required": "Password is required",
        "auth.validation.password.tooShort": "Password must be at least 8 characters",
        "auth.validation.fullName.required": "Full name is required",
        "auth.validation.fullName.tooLong": "Full name cannot exceed 100 characters",
        "auth.validation.confirmPassword.required": "Please confirm your password",
        "auth.validation.confirmPassword.mismatch": "Passwords do not match",
      };
      return translations[key] ?? key;
    },
    i18n: { language: "en" },
  }),
}));

describe("RegisterScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows email taken error when registering with existing email", async () => {
    mockSignUp.mockResolvedValue({ success: false, error: "emailTaken" });

    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId("register-fullName-input"), "Test User");
    fireEvent.changeText(screen.getByTestId("register-email-input"), "existing@test.com");
    fireEvent.changeText(screen.getByTestId("register-password-input"), "password123");
    fireEvent.changeText(screen.getByTestId("register-confirmPassword-input"), "password123");
    fireEvent.press(screen.getByTestId("register-submit-button"));

    expect(await screen.findByText("This email is already registered")).toBeTruthy();
  });

  it("shows password mismatch error without calling signUp", async () => {
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId("register-fullName-input"), "Test User");
    fireEvent.changeText(screen.getByTestId("register-email-input"), "new@test.com");
    fireEvent.changeText(screen.getByTestId("register-password-input"), "password123");
    fireEvent.changeText(screen.getByTestId("register-confirmPassword-input"), "different456");
    fireEvent.press(screen.getByTestId("register-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeTruthy();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows required error when fullName is empty", async () => {
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId("register-email-input"), "new@test.com");
    fireEvent.changeText(screen.getByTestId("register-password-input"), "password123");
    fireEvent.changeText(screen.getByTestId("register-confirmPassword-input"), "password123");
    fireEvent.press(screen.getByTestId("register-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Full name is required")).toBeTruthy();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows success screen when registration succeeds", async () => {
    mockSignUp.mockResolvedValue({ success: true });

    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId("register-fullName-input"), "Test User");
    fireEvent.changeText(screen.getByTestId("register-email-input"), "new@test.com");
    fireEvent.changeText(screen.getByTestId("register-password-input"), "password123");
    fireEvent.changeText(screen.getByTestId("register-confirmPassword-input"), "password123");
    fireEvent.press(screen.getByTestId("register-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Account created!")).toBeTruthy();
      expect(screen.getByText("Check your email to confirm your account")).toBeTruthy();
    });
  });

  it("shows all required errors when form is empty", async () => {
    render(<RegisterScreen />);

    fireEvent.press(screen.getByTestId("register-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Full name is required")).toBeTruthy();
      expect(screen.getByText("Email is required")).toBeTruthy();
      expect(screen.getByText("Password is required")).toBeTruthy();
      expect(screen.getByText("Please confirm your password")).toBeTruthy();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signUp with correct data when validation passes", async () => {
    mockSignUp.mockResolvedValue({ success: true });

    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId("register-fullName-input"), "Test User");
    fireEvent.changeText(screen.getByTestId("register-email-input"), "new@test.com");
    fireEvent.changeText(screen.getByTestId("register-password-input"), "password123");
    fireEvent.changeText(screen.getByTestId("register-confirmPassword-input"), "password123");
    fireEvent.press(screen.getByTestId("register-submit-button"));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "new@test.com",
        password: "password123",
        fullName: "Test User",
      });
    });
  });

  it("navigates to login when login link is pressed", () => {
    render(<RegisterScreen />);

    fireEvent.press(screen.getByTestId("register-login-link"));

    expect(mockBack).toHaveBeenCalled();
  });
});
