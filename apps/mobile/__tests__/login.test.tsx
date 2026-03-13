import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../app/(auth)/login";

const mockSignIn = jest.fn();
const mockPush = jest.fn();

jest.mock("@marineos/hooks", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signOut: jest.fn(),
    user: null,
    session: null,
    loading: false,
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "auth.login.title": "Sign in",
        "auth.login.subtitle": "Log in to your MarineOS account",
        "auth.login.email": "Email",
        "auth.login.emailPlaceholder": "you@email.com",
        "auth.login.password": "Password",
        "auth.login.passwordPlaceholder": "Your password",
        "auth.login.submit": "Sign in",
        "auth.login.noAccount": "Don't have an account?",
        "auth.login.register": "Sign up",
        "auth.login.error.invalidCredentials": "Invalid email or password",
        "auth.validation.email.required": "Email is required",
        "auth.validation.email.invalid": "Invalid email address",
        "auth.validation.password.required": "Password is required",
        "auth.validation.password.tooShort": "Password must be at least 8 characters",
      };
      return translations[key] ?? key;
    },
    i18n: { language: "en" },
  }),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls signIn with correct args and shows no error when credentials are valid", async () => {
    mockSignIn.mockResolvedValue({ success: true });

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("login-email-input"), "user@test.com");
    fireEvent.changeText(screen.getByTestId("login-password-input"), "password123");
    fireEvent.press(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("user@test.com", "password123");
    });

    expect(screen.queryByTestId("login-error-banner")).toBeNull();
  });

  it("shows error banner when password is wrong", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "invalidCredentials" });

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("login-email-input"), "user@test.com");
    fireEvent.changeText(screen.getByTestId("login-password-input"), "wrongpassword");
    fireEvent.press(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeTruthy();
    });
  });

  it("shows error banner when email does not exist", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "invalidCredentials" });

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("login-email-input"), "nonexistent@test.com");
    fireEvent.changeText(screen.getByTestId("login-password-input"), "password123");
    fireEvent.press(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeTruthy();
    });
  });

  it("shows invalid email error without calling signIn when email format is invalid", async () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("login-email-input"), "notanemail");
    fireEvent.changeText(screen.getByTestId("login-password-input"), "password123");
    fireEvent.press(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeTruthy();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows required errors when form is empty", async () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeTruthy();
      expect(screen.getByText("Password is required")).toBeTruthy();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows password too short error", async () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("login-email-input"), "user@test.com");
    fireEvent.changeText(screen.getByTestId("login-password-input"), "short");
    fireEvent.press(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeTruthy();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("disables submit button while loading", async () => {
    let resolveSignIn: (value: { success: boolean }) => void;
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
    );

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("login-email-input"), "user@test.com");
    fireEvent.changeText(screen.getByTestId("login-password-input"), "password123");
    fireEvent.press(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("login-submit-button").props.accessibilityState?.disabled).toBe(
        true
      );
    });

    resolveSignIn!({ success: true });
  });

  it("navigates to register when register link is pressed", () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByTestId("login-register-link"));

    expect(mockPush).toHaveBeenCalledWith("/(auth)/register");
  });
});
