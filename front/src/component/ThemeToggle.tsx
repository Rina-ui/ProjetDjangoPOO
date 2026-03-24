import { useTheme } from "../context/ThemeContext";

type ThemeToggleProps = {
    className?: string;
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const nextLabel = theme === "light" ? "Mode sombre" : "Mode clair";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={className || "btn-ghost"}
            title={nextLabel}
            aria-label={nextLabel}
        >
            Theme: {theme === "light" ? "Clair" : "Sombre"}
        </button>
    );
}