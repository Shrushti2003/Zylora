import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  name: string;
  value?: string;
  minLength?: number;
  required?: boolean;
  autoComplete?: string;
  onChange?: (value: string) => void;
}

export function PasswordInput({
  name,
  value,
  minLength = 8,
  required = true,
  autoComplete,
  onChange
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="auth-password">
      <input
        name={name}
        type={isVisible ? "text" : "password"}
        minLength={minLength}
        required={required}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? <Eye size={17} /> : <EyeOff size={17} />}
      </button>
    </div>
  );
}
