const LightModeOnly = ({ children }) => {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    
    html.classList.remove('dark');
    html.classList.add('light');
    
    return () => {
      html.classList.remove('light');
      if (hadDark) html.classList.add('dark');
    };
  }, []);

  return <div className="light">{children}</div>;
};
