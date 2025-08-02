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
      "bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors duration-200",
    secondary:
      "bg-secondary hover:bg-secondary/90 active:bg-secondary/80 text-secondary-foreground focus:ring-2 focus:ring-secondary/50 focus:ring-offset-2 transition-colors duration-200",
    outline:
      "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground active:bg-accent/80 text-foreground focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors duration-200",
    ghost:
      "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 text-foreground focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors duration-200",
    danger:
      "bg-destructive hover:bg-destructive/90 active:bg-destructive/80 text-destructive-foreground focus:ring-2 focus:ring-destructive/50 focus:ring-offset-2 transition-colors duration-200",
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
