export const currencies = [
  { id: "EUR", label: "EUR", symbol: "€", rate: 1 },
  { id: "GBP", label: "GBP", symbol: "£", rate: 0.85 },
  { id: "USD", label: "USD", symbol: "$", rate: 1.1 },
];

export const osOptions = [
  { id: "win2022", name: "Windows 2022", arch: "64bit", icon: "windowsOS.svg" },
  { id: "win2019", name: "Windows 2019", arch: "64bit", icon: "windowsOS.svg" },
  { id: "win2016", name: "Windows 2016", arch: "64bit", icon: "windowsOS.svg" },
  { id: "almalinux9", name: "Almalinux", arch: "9.x 64bit", icon: "almalinuxOS.svg" },
  { id: "almalinux8", name: "Almalinux", arch: "8.x 64bit", icon: "almalinuxOS.svg" },
  { id: "centos7", name: "CentOS", arch: "7.x 64bit", icon: "centOS.svg" },
  { id: "debian12", name: "Debian", arch: "12.x 64bit", icon: "debianOS.svg" },
  { id: "debian11", name: "Debian", arch: "11.x 64bit", icon: "debianOS.svg" },
  { id: "ubuntu22", name: "Ubuntu", arch: "22.x 64bit", icon: "ubuntuOS.svg" },
  { id: "ubuntu20", name: "Ubuntu", arch: "20.x 64bit", icon: "ubuntuOS.svg" }
];

export const osBrandColors = {
  win2022: "#0078D4",
  win2019: "#0078D4", 
  win2016: "#0078D4",
  ubuntu22: "#E95420",
  ubuntu20: "#E95420",
  debian12: "#A81D33",
  debian11: "#A81D33",
  centos7: "#932279",
  almalinux9: "#0F4266",
  almalinux8: "#0F4266"
};

export const getOSBrandColor = (osId, osName, specs = {}) => {
  // First check if specs contain brandColor from API processing
  if (specs.brandColor) {
    return specs.brandColor;
  }
  
  // If we have a direct match, use it
  if (osBrandColors[osId]) {
    return osBrandColors[osId];
  }
     
  // Otherwise, do pattern matching on the name
  const name = (osName || osId || '').toLowerCase();
     
  if (name.includes('win')) {
    return "#0078D4"; // Windows blue
  }
  if (name.includes('ubuntu')) {
    return "#E95420"; // Ubuntu orange
  }
  if (name.includes('debian')) {
    return "#A81D33"; // Debian red
  }
  if (name.includes('cent')) {
    return "#932279"; // CentOS purple
  }
  if (name.includes('almalinux') || name.includes('alma')) {
    return "#0F4266"; // AlmaLinux blue
  }
  
  // For any other Linux distros (wildcard)
  if (name.includes('linux') || name.includes('rocky') || name.includes('fedora') || 
      name.includes('suse') || name.includes('arch') || name.includes('rhel') || 
      name.includes('oracle') || name.includes('red hat')) {
    return "#8B5CF6"; // Purple for other Linux distros (your wildcard color)
  }
     
  return "#6B7280"; // Gray fallback for completely unknown
};

export const getOSIcon = (osName, specs = {}) => {
  // First check if specs contain icon from API processing
  if (specs.icon) {
    return specs.icon;
  }
  
  // Pattern matching using your existing SVG files
  const name = (osName || '').toLowerCase();
  
  if (name.includes('win')) return 'windowsOS.svg';
  if (name.includes('ubuntu')) return 'ubuntuOS.svg';
  if (name.includes('debian')) return 'debianOS.svg';
  if (name.includes('cent')) return 'centOS.svg';
  if (name.includes('almalinux') || name.includes('alma')) return 'almalinuxOS.svg';
  
  // For everything else, use the generic "other" icon
  return 'otherOS.svg';
};