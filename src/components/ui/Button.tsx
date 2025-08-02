import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary:
      "bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary",
    secondary:
      "bg-secondary hover:bg-secondary/80 text-secondary-foreground focus:ring-secondary",
    outline:
      "border border-border hover:bg-accent hover:text-accent-foreground text-foreground focus:ring-primary",
    ghost:
      "hover:bg-accent hover:text-accent-foreground text-foreground focus:ring-primary",
    danger:
      "bg-destructive hover:bg-destructive/90 text-destructive-foreground focus:ring-destructive",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      )}
      {children}
    </button>
  );
};

export default Button;
