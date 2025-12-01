const getInitialTheme = () => {
  const storedTheme = localStorage.getItem("darkmode");
  return storedTheme;
};

console.log(getInitialTheme(), "storedTheme");

const toggleTheme = (val: boolean) => {
  localStorage.setItem("darkmode", val ? "true" : "false");
  document.documentElement.classList.toggle("dark");
};

export { getInitialTheme, toggleTheme };
