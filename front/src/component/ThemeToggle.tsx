import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button onClick={toggleTheme}>
            Mode: {theme}
        </button>
    );
}