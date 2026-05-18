import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

// Bare-bones monochrome input. Label above, hairline underline only.
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label ? (
          <label
            htmlFor={id}
            className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={`w-full bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black placeholder:text-brut-muted focus:outline-none focus:border-brut-black transition-colors ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
